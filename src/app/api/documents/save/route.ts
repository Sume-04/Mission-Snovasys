
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
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

// Expected S3 key format:
// <authenticated-user-id>/<random-uuid>
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
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

    // 2. Verify the current session
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

    // 3. Parse and validate the request body
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

    // 4. Validate the S3 key
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

    // 5. Verify the uploaded object in S3
    let s3Object;

    try {
      s3Object = await getS3Client().send(
        new HeadObjectCommand({
          Bucket: getS3BucketName(),
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

    // 6. Save document metadata
    // Generate the ID on the server.
    // Avoid INSERT ... RETURNING so the INSERT does not need
    // to return the row through the SELECT policy.
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

    // 7. Record the successful upload in the audit trail
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
