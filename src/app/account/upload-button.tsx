"use client";

import { useRef, useState } from "react";

type UploadResponse = {
  uploadUrl: string;
  objectKey: string;
  contentType: string;
  expiresIn: number;
};

export default function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");
    setIsError(false);

    try {
      // 1. Ask our authenticated API for a temporary S3 URL.
      const urlResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      const urlData = await urlResponse.json();

      if (!urlResponse.ok) {
        throw new Error(urlData.error || "Could not prepare the upload.");
      }

      const uploadData = urlData as UploadResponse;

      // 2. Upload the file directly to private S3.
      const s3Response = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!s3Response.ok) {
        throw new Error("The file could not be uploaded to storage.");
      }

      // 3. Save the document metadata in Supabase.
      const saveResponse = await fetch("/api/documents/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          storagePath: uploadData.objectKey,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saveData.error || "The file was uploaded, but details were not saved.",
        );
      }

      setMessage(`Successfully uploaded ${file.name}`);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setUploading(false);

      // Allow selecting the same file again.
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "+ Upload Document"}
      </button>

      {message && (
        <p
          role="status"
          className={`max-w-xs text-sm ${
            isError ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}