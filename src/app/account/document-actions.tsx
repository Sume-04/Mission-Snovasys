"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DocxPreview from "@/components/docx-preview";

type DocumentActionsProps = {
  documentId: string;
  contentType: string;
};

type UrlResponse = {
  url?: string;
  error?: string;
};

type DeleteResponse = {
  success?: boolean;
  error?: string;
};

type ShareResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type SharedRecipient = {
  recipient_id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  permission: "view" | "download";
  created_at: string;
};

type SharesResponse = {
  success?: boolean;
  shares?: SharedRecipient[];
  error?: string;
};

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function DocumentActions({
  documentId,
  contentType,
}: DocumentActionsProps) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<
    "view" | "download" | "delete" | "share" | "revoke" | "manage" | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showShareForm, setShowShareForm] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "download">("view");

  const [sharedRecipients, setSharedRecipients] = useState<
    SharedRecipient[]
  >([]);

  // DOCX preview modal state
  const [docxPreviewUrl, setDocxPreviewUrl] = useState("");
  const [showDocxPreview, setShowDocxPreview] = useState(false);

  const isDocx =
    contentType.toLowerCase().includes("wordprocessingml.document") ||
    contentType.toLowerCase() === DOCX_CONTENT_TYPE;

  // VIEW OR DOWNLOAD DOCUMENT
  async function handleAction(action: "view" | "download") {
    setLoadingAction(action);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/url?action=${action}`,
      );

      const data = (await response.json()) as UrlResponse;

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not access this document.");
      }

      if (action === "view") {
        if (isDocx) {
          // Display DOCX inside the application
          setDocxPreviewUrl(data.url);
          setShowDocxPreview(true);
        } else {
          // Keep PDF and other supported files opening in a new tab
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      } else {
        // Download the document
        window.location.href = data.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  // CLOSE DOCX PREVIEW
  function closeDocxPreview() {
    setShowDocxPreview(false);
    setDocxPreviewUrl("");
  }

  // DELETE DOCUMENT
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this document?",
    );

    if (!confirmed) return;

    setLoadingAction("delete");
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/delete`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as DeleteResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not delete this document.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  // LOAD RECIPIENTS
  async function loadSharedRecipients() {
    setLoadingAction("manage");
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/share`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as SharesResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not load document access.");
      }

      setSharedRecipients(data.shares ?? []);
      setShowManageAccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  // REVOKE ACCESS
  async function handleRevoke(recipientId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this user's access?",
    );

    if (!confirmed) return;

    setLoadingAction("revoke");
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/share?sharedWith=${encodeURIComponent(
          recipientId,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as ShareResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not revoke access.");
      }

      setSharedRecipients((current) =>
        current.filter(
          (recipient) => recipient.recipient_id !== recipientId,
        ),
      );

      setSuccess(data.message || "Access revoked successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  // SHARE DOCUMENT
  async function handleShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = recipientEmail.trim().toLowerCase();

    if (!email) {
      setError("Please enter the recipient's email address.");
      return;
    }

    setLoadingAction("share");
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            permission,
          }),
        },
      );

      const data = (await response.json()) as ShareResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not share this document.");
      }

      setSuccess(data.message || "Document shared successfully.");
      setRecipientEmail("");
      setShowShareForm(false);

      // Refresh the recipient list if Manage Access is open.
      if (showManageAccess) {
        await loadSharedRecipients();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* VIEW */}
      <button
        type="button"
        onClick={() => handleAction("view")}
        disabled={loadingAction !== null}
        className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "view" ? "Opening..." : "View"}
      </button>

      {/* DOWNLOAD */}
      <button
        type="button"
        onClick={() => handleAction("download")}
        disabled={loadingAction !== null}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "download" ? "Preparing..." : "Download"}
      </button>

      {/* SHARE */}
      <button
        type="button"
        onClick={() => {
          setShowShareForm((current) => !current);
          setError("");
          setSuccess("");
        }}
        disabled={loadingAction !== null}
        className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Share
      </button>

      {/* MANAGE ACCESS */}
      <button
        type="button"
        onClick={() => {
          if (showManageAccess) {
            setShowManageAccess(false);
          } else {
            loadSharedRecipients();
          }
        }}
        disabled={loadingAction !== null}
        className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "manage"
          ? "Loading..."
          : showManageAccess
            ? "Hide Access"
            : "Manage Access"}
      </button>

      {/* DELETE */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loadingAction !== null}
        className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "delete" ? "Deleting..." : "Delete"}
      </button>

      {/* SHARE FORM */}
      {showShareForm && (
        <form
          onSubmit={handleShare}
          className="mt-3 w-full space-y-3 rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4"
        >
          <p className="text-sm font-semibold text-white">
            Share this document
          </p>

          <input
            type="email"
            required
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="Recipient's registered email"
            className="w-full rounded-lg border border-white/10 bg-[#070B18] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
          />

          <select
            value={permission}
            onChange={(event) =>
              setPermission(event.target.value as "view" | "download")
            }
            className="w-full rounded-lg border border-white/10 bg-[#070B18] px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/50"
          >
            <option value="view">View only</option>
            <option value="download">View and download</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loadingAction !== null}
              className="rounded-lg bg-indigo-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 disabled:opacity-50"
            >
              {loadingAction === "share" ? "Sharing..." : "Share Document"}
            </button>

            <button
              type="button"
              onClick={() => setShowShareForm(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* MANAGE ACCESS PANEL */}
      {showManageAccess && (
        <div className="mt-3 w-full space-y-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              People with access
            </p>

            <button
              type="button"
              onClick={loadSharedRecipients}
              disabled={loadingAction !== null}
              className="text-xs text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {sharedRecipients.length === 0 ? (
            <p className="text-sm text-slate-400">
              This document has not been shared with anyone.
            </p>
          ) : (
            <div className="space-y-2">
              {sharedRecipients.map((recipient) => (
                <div
                  key={recipient.recipient_id}
                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#070B18] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white">
                      {recipient.display_name ||
                        recipient.email ||
                        "Unknown recipient"}
                    </p>

                    {recipient.username && (
                      <p className="break-all text-xs text-indigo-300">
                        @{recipient.username}
                      </p>
                    )}

                    {recipient.email && (
                      <p className="break-all text-xs text-slate-400">
                        {recipient.email}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-slate-400">
                      Permission:{" "}
                      <span className="font-medium text-white">
                        {recipient.permission === "download"
                          ? "View and download"
                          : "View only"}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Shared on{" "}
                      {new Date(
                        recipient.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRevoke(recipient.recipient_id)
                    }
                    disabled={loadingAction !== null}
                    className="shrink-0 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAction === "revoke"
                      ? "Revoking..."
                      : "Revoke Access"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ERROR FEEDBACK */}
      {error && (
        <p className="w-full text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* SUCCESS FEEDBACK */}
      {success && (
        <p className="w-full text-sm text-emerald-400" role="status">
          {success}
        </p>
      )}

      {/* DOCX PREVIEW MODAL */}
      {showDocxPreview && docxPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Word document preview"
          onClick={closeDocxPreview}
        >
          <div
            className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <h2 className="text-sm font-semibold text-white sm:text-base">
                Word Document Preview
              </h2>

              <button
                type="button"
                onClick={closeDocxPreview}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                aria-label="Close preview"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-3 sm:p-6">
              <DocxPreview url={docxPreviewUrl} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}