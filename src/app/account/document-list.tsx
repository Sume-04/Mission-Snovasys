
"use client";

import { useMemo, useState } from "react";
import DocumentActions from "./document-actions";

type Document = {
  id: string;
  name: string;
  category: string | null;
  size_bytes: number | string;
  created_at: string;
  content_type: string | null;
};

type DocumentListProps = {
  documents: Document[];
};

export default function DocumentList({
  documents,
}: DocumentListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      documents.map((document) => document.category || "Other"),
    );

    return ["All", ...Array.from(uniqueCategories).sort()];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const documentCategory = document.category || "Other";

      const matchesSearch = document.name
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesCategory =
        category === "All" || documentCategory === category;

      return matchesSearch && matchesCategory;
    });
  }, [documents, search, category]);

  return (
    <div>
      {/* Search and category filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search documents by name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-xl border border-white/10 bg-[#0B1020] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Categories" : item}
            </option>
          ))}
        </select>
      </div>

      {/* Document results */}
      {filteredDocuments.length > 0 ? (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                  ▤
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {document.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {document.category || "Other"} ·{" "}
                    {(Number(document.size_bytes) / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="shrink-0 text-xs text-slate-500">
                  {new Date(document.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>

                <DocumentActions
                  documentId={document.id}
                  contentType={document.content_type ?? ""}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 text-3xl text-cyan-300">⌕</div>

          <h3 className="text-lg font-semibold text-white">
            No documents found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try another search term or category.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Showing {filteredDocuments.length} of {documents.length} documents
      </p>
    </div>
  );
}
