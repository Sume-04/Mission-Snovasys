
"use client";

import { useState } from "react";
import DocxPreview from "@/components/docx-preview";

type Props = {
  documentId: string;
  permission: "view" | "download";
  contentType?: string;
  fileName?: string;
};

type UrlResponse = {
  url?: string;
  error?: string;
};

export default function SharedDocumentActions({
  documentId,
  permission,
  contentType = "",
  fileName = "",
}: Props) {
  const [loading, setLoading] = useState<"view" | "download" | null>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isDocx =
    contentType.toLowerCase().includes("wordprocessingml") ||
    contentType.toLowerCase().includes("msword") ||
    fileName.toLowerCase().endsWith(".docx");

  async function openDocument(action: "view" | "download") {
    if (action === "download" && permission !== "download") {
      setError("Download permission has not been granted.");
      return;
    }

    setLoading(action);
    setError("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}/url?action=${action}`,
        { cache: "no-store" },
      );

      const result = (await response.json()) as UrlResponse;

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to access document.");
      }

      if (action === "view" && isDocx) {
        // Display DOCX inside TrustVault.
        setPreviewUrl(result.url);
        setShowPreview(true);
      } else if (action === "view") {
        // Preserve existing PDF and other file viewing behavior.
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        // Preserve download behavior.
        window.location.href = result.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to access document.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openDocument("view")}
          disabled={loading !== null}
          className="rounded-lg border border-cyan-400/20 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
        >
          {loading === "view" ? "Opening..." : "View"}
        </button>

        {permission === "download" && (
          <button
            type="button"
            onClick={() => openDocument("download")}
            disabled={loading !== null}
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading === "download" ? "Preparing..." : "Download"}
          </button>
        )}

        {error && (
          <p className="w-full text-xs text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>

      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Word Document Preview
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl("");
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto bg-white p-4">
              <DocxPreview url={previewUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
