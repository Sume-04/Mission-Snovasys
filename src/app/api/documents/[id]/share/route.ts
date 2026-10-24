
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ShareRequest = {
  email?: unknown;
  permission?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_PERMISSIONS = new Set(["view", "download"]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper: authenticate the request.
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

// Helper: verify that the authenticated user owns the document.
async function verifyDocumentOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  documentId: string,
  userId: string,
) {
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, owner_id, name")
    .eq("id", documentId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Document ownership lookup failed:", error);

    return {
      document: null,
      error: true,
    };
  }

  return {
    document,
    error: false,
  };
}

// GET: LIST RECIPIENTS WHO HAVE ACCESS
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 },
      );
    }

    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // Only the document owner can list recipients.
    const { document, error: ownershipError } =
      await verifyDocumentOwner(supabase, documentId, user.id);

    if (ownershipError) {
      return NextResponse.json(
        { error: "Unable to verify document ownership." },
        { status: 500 },
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or you are not the owner." },
        { status: 404 },
      );
    }

    // Retrieve recipient names and emails using the secure SQL function.
    const { data: shares, error: sharesError } = await supabase.rpc(
      "get_document_share_recipients",
      {
        p_document_id: documentId,
      },
    );

    if (sharesError) {
      console.error("Fetch shares error:", sharesError);

      return NextResponse.json(
        { error: "Unable to retrieve document access." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      shares: shares ?? [],
    });
  } catch (error) {
    console.error("Fetch shares error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// POST: SHARE DOCUMENT AND CREATE NOTIFICATION
export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 },
      );
    }

    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // Parse JSON safely.
    let body: ShareRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const permission = body.permission;

    if (
      !email ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email) ||
      typeof permission !== "string" ||
      !ALLOWED_PERMISSIONS.has(permission)
    ) {
      return NextResponse.json(
        {
          error:
            "A valid recipient email and permission are required.",
        },
        { status: 400 },
      );
    }

    // Only the document owner can share it.
    const { document, error: ownershipError } =
      await verifyDocumentOwner(supabase, documentId, user.id);

    if (ownershipError) {
      return NextResponse.json(
        { error: "Unable to verify document ownership." },
        { status: 500 },
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or you are not the owner." },
        { status: 404 },
      );
    }

    // Prevent sharing with yourself.
    if (email === user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot share a document with yourself." },
        { status: 400 },
      );
    }

    // Find the recipient through the secure database function.
    const { data: recipient, error: recipientError } =
      await supabase.rpc("get_user_id_by_email", {
        recipient_email: email,
      });

    if (recipientError) {
      console.error("Recipient lookup failed:", recipientError);

      return NextResponse.json(
        { error: "Unable to verify the recipient." },
        { status: 500 },
      );
    }

    if (!recipient) {
      return NextResponse.json(
        {
          error:
            "Recipient not found. The recipient must have a TrustVault account.",
        },
        { status: 404 },
      );
    }

    // The RPC may return either a UUID string or an object.
    const recipientId =
      typeof recipient === "string"
        ? recipient
        : typeof recipient === "object" &&
            recipient !== null &&
            "id" in recipient &&
            typeof recipient.id === "string"
          ? recipient.id
          : null;

    if (!recipientId) {
      console.error("Unexpected recipient RPC response:", recipient);

      return NextResponse.json(
        { error: "Unable to verify the recipient." },
        { status: 500 },
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: "You cannot share a document with yourself." },
        { status: 400 },
      );
    }

    // Create the share record.
    const { error: shareError } = await supabase
      .from("document_shares")
      .insert({
        document_id: document.id,
        owner_id: user.id,
        shared_with: recipientId,
        permission,
      });

    if (shareError) {
      if (shareError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "This document is already shared with this user.",
          },
          { status: 409 },
        );
      }

      console.error("Share insert error:", shareError);

      return NextResponse.json(
        { error: "Unable to share document." },
        { status: 500 },
      );
    }

    // Create a notification only after the share succeeds.
    const sharerName =
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.email ||
      "A TrustVault user";

    const documentName = document.name || "a document";

    const notificationMessage =
      `${sharerName} shared "${documentName}" with you.`;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientId,
        document_id: document.id,
        actor_id: user.id,
        type: "document_shared",
        message: notificationMessage,
        is_read: false,
      });

    if (notificationError) {
      // The share itself has already succeeded.
      console.error(
        "Notification creation error:",
        notificationError,
      );

      return NextResponse.json({
        success: true,
        message: `Document shared with ${email}.`,
        notificationCreated: false,
        warning:
          "The document was shared, but the notification could not be created.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Document shared with ${email}.`,
      notificationCreated: true,
    });
  } catch (error) {
    console.error("Share document error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// DELETE: REVOKE DOCUMENT ACCESS
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id: documentId } = await context.params;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 },
      );
    }

    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const requestUrl = new URL(request.url);
    const recipientId = requestUrl.searchParams.get("sharedWith");

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required." },
        { status: 400 },
      );
    }

    // Verify ownership before attempting to revoke access.
    const { document, error: ownershipError } =
      await verifyDocumentOwner(supabase, documentId, user.id);

    if (ownershipError) {
      return NextResponse.json(
        { error: "Unable to verify document ownership." },
        { status: 500 },
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or you are not the owner." },
        { status: 404 },
      );
    }

    // Only this document owner can revoke this recipient's access.
    const { data: deletedShare, error: deleteError } = await supabase
      .from("document_shares")
      .delete()
      .eq("document_id", documentId)
      .eq("owner_id", user.id)
      .eq("shared_with", recipientId)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Revoke access error:", deleteError);

      return NextResponse.json(
        { error: "Unable to revoke document access." },
        { status: 500 },
      );
    }

    if (!deletedShare) {
      return NextResponse.json(
        { error: "No matching access record was found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document access revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke access error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}