import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

import { writeAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getS3Client, getS3BucketName } from "@/lib/aws/s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SupportedContentType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "text/plain"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Performs a basic signature/content check against the actual S3 bytes.
 *
 * Note:
 * - DOCX is a ZIP-based format. This checks its ZIP signature, not the
 *   complete internal Word document structure.
 * - TXT is checked as valid UTF-8 text without NUL bytes.
 * - These checks are not malware scanning.
 */
function matchesFileContent(
  bytes: Uint8Array,
  contentType: SupportedContentType,
): boolean {
  if (bytes.length === 0) {
    return false;
  }

  switch (contentType) {
    case "application/pdf":
      return (
        bytes.length >= 5 &&
        Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-"
      );

    case "image/jpeg":
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );

    case "image/png":
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      // DOCX files are ZIP archives. This is a basic signature check only.
      return (
        bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      );

    case "text/plain": {
      // Reject binary-looking content.
      if (bytes.some((byte) => byte === 0x00)) {
        return false;
      }

      // Ensure the bytes can be decoded as valid UTF-8.
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return true;
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user.
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    // 2. Verify the current session.
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (
      sessionError ||
      !session ||
      session.user.id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Your session could not be verified. Please sign in again.",
        },
        { status: 401 },
      );
    }

    // 3. Parse and validate the request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      !("storagePath" in body) ||
      !("contentType" in body) ||
      !("sizeBytes" in body)
    ) {
      return NextResponse.json(
        { error: "Invalid document details." },
        { status: 400 },
      );
    }

    const { name, storagePath, contentType, sizeBytes } = body as {
      name: unknown;
      storagePath: unknown;
      contentType: unknown;
      sizeBytes: unknown;
    };

    if (
      typeof name !== "string" ||
      typeof storagePath !== "string" ||
      typeof contentType !== "string" ||
      typeof sizeBytes !== "number" ||
      !Number.isFinite(sizeBytes)
    ) {
      return NextResponse.json(
        { error: "Invalid document details." },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    if (
      trimmedName.length === 0 ||
      trimmedName.length > 255 ||
      trimmedName.includes("\0") ||
      sizeBytes <= 0 ||
      sizeBytes > MAX_FILE_SIZE ||
      !ALLOWED_TYPES.has(contentType)
    ) {
      return NextResponse.json(
        {
          error:
            "File is not allowed. Use a supported file type up to 10 MB.",
        },
        { status: 400 },
      );
    }

    // 4. Validate the S3 key.
    // Expected: <authenticated-user-id>/<random-uuid>
    const storagePathParts = storagePath.split("/");

    if (
      storagePathParts.length !== 2 ||
      storagePathParts[0] !== user.id ||
      !UUID_PATTERN.test(storagePathParts[1])
    ) {
      return NextResponse.json(
        { error: "Invalid storage path." },
        { status: 403 },
      );
    }

    const s3Client = getS3Client();
    const bucketName = getS3BucketName();

    // 5. Verify the S3 object's metadata.
    let s3Object;

    try {
      s3Object = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: storagePath,
        }),
      );
    } catch (error) {
      console.error("S3 object verification failed:", error);

      return NextResponse.json(
        {
          error:
            "The uploaded file could not be verified. Please upload it again.",
        },
        { status: 400 },
      );
    }

    const actualSize = s3Object.ContentLength;
    const actualContentType = s3Object.ContentType;

    if (
      typeof actualSize !== "number" ||
      actualSize <= 0 ||
      actualSize > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { error: "The uploaded file size is invalid." },
        { status: 400 },
      );
    }

    if (
      actualSize !== sizeBytes ||
      actualContentType !== contentType ||
      !ALLOWED_TYPES.has(actualContentType ?? "")
    ) {
      return NextResponse.json(
        { error: "Uploaded file details do not match." },
        { status: 400 },
      );
    }

    // 6. Read the actual S3 bytes and validate the file signature/content.
    let fileBytes: Uint8Array;

    try {
      const objectResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: storagePath,
        }),
      );

      if (!objectResponse.Body) {
        return NextResponse.json(
          { error: "The uploaded file content could not be read." },
          { status: 400 },
        );
      }

      fileBytes = await objectResponse.Body.transformToByteArray();
    } catch (error) {
      console.error("Unable to read uploaded S3 object:", error);

      return NextResponse.json(
        { error: "Unable to verify the uploaded file content." },
        { status: 400 },
      );
    }

    // Confirm the retrieved byte count agrees with the S3 metadata.
    if (fileBytes.length !== actualSize) {
      return NextResponse.json(
        { error: "The uploaded file content is incomplete or invalid." },
        { status: 400 },
      );
    }

    if (
      !matchesFileContent(
        fileBytes,
        contentType as SupportedContentType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The file content does not match its declared file type.",
        },
        { status: 400 },
      );
    }

    // 7. Save document metadata only after validation succeeds.
    const documentId = randomUUID();

    const { error: insertError } = await supabase
      .from("documents")
      .insert({
        id: documentId,
        owner_id: user.id,
        name: trimmedName,
        category: "Other",
        storage_path: storagePath,
        content_type: actualContentType,
        size_bytes: actualSize,
      });

    if (insertError) {
      console.error("Document metadata insert failed:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });

      return NextResponse.json(
        {
          error: "Unable to save document details.",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 },
      );
    }

    // 8. Record the successful upload in the audit trail.
    // Audit failure does not undo a successful document save.
    try {
      await writeAuditEvent({
        actorId: user.id,
        documentId,
        action: "document.upload",
        outcome: "success",
        metadata: {
          documentName: trimmedName,
          contentType: actualContentType,
          sizeBytes: actualSize,
          validation: "s3_content_signature_checked",
        },
      });
    } catch (auditError) {
      console.error("Failed to audit document upload:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Document details saved successfully.",
      documentId,
    });
  } catch (error) {
    console.error("Unable to save document metadata:", error);

    return NextResponse.json(
      { error: "Unable to save document details." },
      { status: 500 },
    );
  }
}