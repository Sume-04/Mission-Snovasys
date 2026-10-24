
"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

type DocxPreviewProps = {
  url: string;
};

export default function DocxPreview({ url }: DocxPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function renderDocument() {
      const container = previewRef.current;

      if (!container) return;

      container.innerHTML = "";
      setError("");
      setLoading(true);

      try {
        if (!url?.trim()) {
          throw new Error("The document preview URL is missing.");
        }

        console.log("DOCX preview URL:", url);

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        console.log("DOCX response status:", response.status);

        if (!response.ok) {
          throw new Error(
            `Document request failed: ${response.status} ${response.statusText}`
          );
        }

        const buffer = await response.arrayBuffer();

        if (cancelled || !previewRef.current) return;

        if (buffer.byteLength === 0) {
          throw new Error("The document returned an empty file.");
        }

        await renderAsync(
          buffer,
          previewRef.current,
          previewRef.current,
          {
            inWrapper: true,
            breakPages: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
          }
        );
      } catch (err) {
        if (cancelled) return;

        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("DOCX preview error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to preview this document."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    renderDocument();

    return () => {
      cancelled = true;
      controller.abort();

      if (previewRef.current) {
        previewRef.current.innerHTML = "";
      }
    };
  }, [url]);

  return (
    <div className="w-full">
      {loading && (
        <p className="p-4 text-center text-sm text-slate-500">
          Loading Word document...
        </p>
      )}

      {error && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div
        ref={previewRef}
        className="docx-preview min-h-[400px] overflow-auto rounded-md bg-gray-100 p-4"
      />
    </div>
  );
}
