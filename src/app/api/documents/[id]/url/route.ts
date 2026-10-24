
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getS3Client, getS3BucketName } from "@/lib/aws/s3";

export const runtime = "nodejs";

const URL_EXPIRATION_SECONDS = 300;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
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

    // 2. Validate document ID and requested action
    const { id } = await context.params;

    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");

    if (!id || !["view", "download"].includes(action ?? "")) {
      return NextResponse.json(
        { error: "Invalid document request." },
        { status: 400 },
      );
    }

    // 3. Retrieve document metadata
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, owner_id, name, storage_path, content_type")
      .eq("id", id)
      .maybeSingle();

    if (documentError) {
      console.error("Document lookup failed:", documentError);

      return NextResponse.json(
        { error: "Unable to retrieve document details." },
        { status: 500 },
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 },
      );
    }

    // 4. Verify document permissions
    const isOwner = document.owner_id === user.id;

    if (!isOwner) {
      const { data: share, error: shareError } = await supabase
        .from("document_shares")
        .select("permission")
        .eq("document_id", id)
        .eq("shared_with", user.id)
        .maybeSingle();

      if (shareError) {
        console.error("Share lookup failed:", shareError);

        return NextResponse.json(
          { error: "Unable to verify document access." },
          { status: 500 },
        );
      }

      if (!share) {
        return NextResponse.json(
          { error: "You do not have access to this document." },
          { status: 403 },
        );
      }

      // Download requires explicit download permission
      if (
        action === "download" &&
        share.permission !== "download"
      ) {
        return NextResponse.json(
          { error: "Download permission has not been granted." },
          { status: 403 },
        );
      }

      // View is allowed for view or download permissions
      if (
        action === "view" &&
        !["view", "download"].includes(share.permission)
      ) {
        return NextResponse.json(
          { error: "You do not have permission to view this document." },
          { status: 403 },
        );
      }
    }

    // 5. Prepare safe filename and content type
    const safeFileName = document.name.replace(/["\\\r\n]/g, "_");

    const DOCX_CONTENT_TYPE =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const contentType =
      document.content_type === DOCX_CONTENT_TYPE
        ? DOCX_CONTENT_TYPE
        : document.content_type || "application/octet-stream";

    // 6. Configure inline viewing or download
    const disposition =
      action === "download"
        ? `attachment; filename="${safeFileName}"`
        : `inline; filename="${safeFileName}"`;

    // 7. Generate a temporary signed S3 URL
    const command = new GetObjectCommand({
      Bucket: getS3BucketName(),
      Key: document.storage_path,
      ResponseContentType: contentType,
      ResponseContentDisposition: disposition,
    });

    const signedUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn: URL_EXPIRATION_SECONDS,
    });

    // 8. Return the signed URL
    return NextResponse.json({
      url: signedUrl,
      expiresIn: URL_EXPIRATION_SECONDS,
    });
  } catch (error) {
    console.error("Unable to create document access URL:", error);

    return NextResponse.json(
      {
        error: "Unable to access this document. Please try again.",
      },
      { status: 500 },
    );
  }
}
