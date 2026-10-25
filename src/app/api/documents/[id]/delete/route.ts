
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getS3Client, getS3BucketName } from "@/lib/aws/s3";
import { writeAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  let actorId: string | null = null;
  let documentId: string | null = null;

  try {
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

    actorId = user.id;

    const { id } = await context.params;
    documentId = id;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 },
      );
    }

    // Find the document and verify that it belongs to this user.
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, owner_id, storage_path")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (documentError) {
      console.error("Document lookup failed:", documentError);

      return NextResponse.json(
        { error: "Could not verify document ownership." },
        { status: 500 },
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied." },
        { status: 404 },
      );
    }

    // Delete the file from the private S3 bucket.
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getS3BucketName(),
        Key: document.storage_path,
      }),
    );

    // Delete the document metadata from Supabase.
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (deleteError) {
      console.error("Metadata deletion failed:", deleteError);

      return NextResponse.json(
        {
          error:
            "The file was removed from storage, but its database record could not be deleted.",
        },
        { status: 500 },
      );
    }

    // Record the successful document deletion in the audit trail.
    try {
      await writeAuditEvent({
        actorId: user.id,
        documentId: document.id,
        action: "delete",
        outcome: "success",
        metadata: {
          storagePath: document.storage_path,
        },
      });
    } catch (auditError) {
      // The document is already deleted. Do not report deletion as failed
      // solely because audit logging failed.
      console.error("Delete audit logging failed:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Document deletion failed:", error);

    // Best-effort failure audit for unexpected errors.
    if (actorId && documentId) {
      try {
        await writeAuditEvent({
          actorId,
          documentId,
          action: "delete",
          outcome: "failure",
          metadata: {
            error:
              error instanceof Error
                ? error.message
                : "Unknown deletion error",
          },
        });
      } catch (auditError) {
        console.error("Delete failure audit logging failed:", auditError);
      }
    }

    return NextResponse.json(
      { error: "Something went wrong while deleting the document." },
      { status: 500 },
    );
  }
}
