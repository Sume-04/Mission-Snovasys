
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getS3Client, getS3BucketName } from "@/lib/aws/s3";
import { writeAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: Request) {
  let actorId: string | null = null;
  let objectKey: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to upload a document." },
        { status: 401 },
      );
    }

    actorId = user.id;

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("fileName" in body) ||
      !("contentType" in body) ||
      !("fileSize" in body)
    ) {
      return NextResponse.json(
        { error: "Invalid upload request." },
        { status: 400 },
      );
    }

    const { fileName, contentType, fileSize } = body as {
      fileName: unknown;
      contentType: unknown;
      fileSize: unknown;
    };

    if (
      typeof fileName !== "string" ||
      typeof contentType !== "string" ||
      typeof fileSize !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid file details." },
        { status: 400 },
      );
    }

    if (
      fileName.trim().length === 0 ||
      fileName.length > 255 ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE ||
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

    // The key is controlled by the server and scoped to the authenticated user.
    objectKey = `${user.id}/${randomUUID()}`;

    const s3Client = getS3Client();
    const s3BucketName = getS3BucketName();

    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    // This records URL generation, not confirmation of an S3 upload.
    try {
      await writeAuditEvent({
        actorId: user.id,
        documentId: null,
        action: "upload",
        outcome: "success",
        metadata: {
          fileName,
          contentType,
          fileSize,
          objectKey,
          stage: "presigned_url_created",
        },
      });
    } catch (auditError) {
      console.error("Upload URL audit logging failed:", auditError);
    }

    return NextResponse.json({
      uploadUrl,
      objectKey,
      contentType,
      expiresIn: 60,
    });
  } catch (error) {
    console.error("Unable to create upload URL:", error);

    if (actorId) {
      try {
        await writeAuditEvent({
          actorId,
          documentId: null,
          action: "upload",
          outcome: "failure",
          metadata: {
            objectKey,
            stage: "presigned_url_creation",
          },
        });
      } catch (auditError) {
        console.error("Upload failure audit logging failed:", auditError);
      }
    }

    return NextResponse.json(
      { error: "Unable to prepare the upload. Please try again." },
      { status: 500 },
    );
  }
}
