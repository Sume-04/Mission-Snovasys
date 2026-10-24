
import NotificationBell from "./notification-bell";
import DocumentList from "./document-list";
import UploadButton from "./upload-button";
import SharedDocumentActions from "./shared-document-actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "./signout-button";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 1. Fetch documents uploaded by the signed-in user.
  const {
    data: documents,
    error: documentsError,
  } = await supabase
    .from("documents")
    .select(
      "id, name, category, storage_path, content_type, size_bytes, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  // 2. Fetch documents shared with the signed-in user.
  const {
    data: sharedDocuments,
    error: sharedDocumentsError,
  } = await supabase
    .from("document_shares")
    .select(`
      id,
      owner_id,
      permission,
      created_at,
      documents (
        id,
        name,
        category,
        storage_path,
        content_type,
        size_bytes,
        created_at
      )
    `)
    .eq("shared_with", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch profile details for the owners who shared documents.
  const sharedOwnerIds = [
    ...new Set((sharedDocuments ?? []).map((share) => share.owner_id)),
  ];

  const { data: sharedOwners } =
    sharedOwnerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, display_name, username, email")
          .in("id", sharedOwnerIds)
      : { data: [] };

  const sharedOwnersById = new Map(
    (sharedOwners ?? []).map((profile) => [profile.id, profile]),
  );

  // 4. Convert shared-document results into a simple list.
  const sharedItems = (sharedDocuments ?? []).flatMap((share) => {
    const document = Array.isArray(share.documents)
      ? share.documents[0]
      : share.documents;

    if (!document) {
      return [];
    }

    return [
      {
        ...document,
        shareId: share.id,
        permission: share.permission,
        sharedAt: share.created_at,
        owner: sharedOwnersById.get(share.owner_id) ?? null,
      },
    ];
  });

  return (
    <main className="min-h-screen bg-[#070B18] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0B1020] px-5 py-7 lg:flex">
          <Link href="/" className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
              T
            </div>

            <span className="text-xl font-bold tracking-tight">
              Trust<span className="text-cyan-400">Vault</span>
            </span>
          </Link>

          <div className="mt-12">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-2">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300"
              >
                <span>▦</span>
                Overview
              </Link>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                <span>▤</span>
                My Documents
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                <span>↗</span>
                Shared with Me
              </div>
            </nav>
          </div>

          <div className="mt-10">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Account
            </p>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
              <span>⚙</span>
              Settings
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/10 to-indigo-500/5 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-lg text-cyan-300">
              ◈
            </div>

            <p className="text-sm font-semibold">
              Your vault, your control
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your account is protected by Supabase authentication.
            </p>
          </div>
        </aside>

        {/* Main dashboard */}
        <section className="min-w-0 flex-1">
          {/* Top navigation */}
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
                T
              </div>

              <span className="text-lg font-bold">
                Trust<span className="text-cyan-400">Vault</span>
              </span>
            </div>

            <div className="hidden sm:block">
              <p className="text-sm text-slate-400">Workspace</p>
              <p className="mt-1 text-sm font-semibold">
                Personal Vault
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[220px] truncate text-sm font-medium text-white">
                  {user.email}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Personal account
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                {(user.email?.[0] ?? "U").toUpperCase()}
              </div>

              <NotificationBell />
              <SignOutButton />
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {/* Welcome */}
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 text-sm font-medium text-cyan-400">
                  YOUR PERSONAL WORKSPACE
                </p>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome to your vault
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                  Manage your important documents from one secure place.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-sm font-medium text-emerald-300">
                  Session verified
                </span>
              </div>
            </div>

            {/* Overview cards */}
            <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-6 transition hover:border-cyan-400/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Document Library
                  </p>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                    ▤
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  {documents?.length ?? 0} Recent Documents
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your latest documents are available in your secure vault.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-6 transition hover:border-indigo-400/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Shared Documents
                  </p>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-xl text-indigo-300">
                    ↗
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  {sharedItems.length} Shared With Me
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Access documents shared with your account.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-6 transition hover:border-emerald-400/20 sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Account Security
                  </p>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-xl text-emerald-300">
                    ◈
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Authentication active
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your current session has been verified by Supabase.
                </p>
              </div>
            </div>

            {/* My Documents */}
            <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020]">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    My Documents
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter, and manage your uploaded documents.
                  </p>
                </div>

                <UploadButton />
              </div>

              <div className="p-6">
                {documentsError ? (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm text-red-300">
                      Unable to load your documents. Please refresh the page.
                    </p>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <DocumentList documents={documents} />
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/5 text-3xl text-cyan-300">
                      ▤
                    </div>

                    <h3 className="text-lg font-semibold">
                      No documents yet
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Upload your first document to start building your secure vault.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared With Me */}
            <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020]">
              <div className="border-b border-white/10 px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Shared With Me
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documents shared with you by other TrustVault users.
                </p>
              </div>

              <div className="p-6">
                {sharedDocumentsError ? (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm text-red-300">
                      Unable to load shared documents. Please refresh the page.
                    </p>
                  </div>
                ) : sharedItems.length > 0 ? (
                  <div className="space-y-3">
                    {sharedItems.map((document) => (
                      <div
                        key={document.shareId}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {document.name}
                          </p>

                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-slate-300">
                              Shared by:{" "}
                              <span className="font-medium text-white">
                                {document.owner?.full_name ||
                                  document.owner?.display_name ||
                                  "Unknown owner"}
                              </span>
                            </p>

                            {document.owner?.username && (
                              <p className="break-all text-xs text-indigo-300">
                                @{document.owner.username}
                              </p>
                            )}

                            {document.owner?.email && (
                              <p className="break-all text-xs text-slate-400">
                                {document.owner.email}
                              </p>
                            )}

                            <p className="text-xs text-slate-500">
                              Permission:{" "}
                              <span className="text-slate-300">
                                {document.permission === "download"
                                  ? "View and download"
                                  : "View only"}
                              </span>
                            </p>

                            <p className="text-xs text-slate-500">
                              Shared on{" "}
                              {new Date(document.sharedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Updated: pass document metadata for DOCX detection */}
                        <SharedDocumentActions
                          documentId={document.id}
                          permission={document.permission}
                          contentType={document.content_type ?? ""}
                          fileName={document.name ?? ""}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <h3 className="font-semibold">
                      No shared documents
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Documents shared with your account will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Account information */}
            <div className="mt-9 rounded-2xl border border-white/10 bg-[#0B1020] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-cyan-400">
                    ACCOUNT INFORMATION
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Your profile
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Signed in with your verified Supabase session.
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl font-bold text-cyan-300">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email address
                </p>

                <p className="mt-2 break-all text-sm font-medium text-slate-200">
                  {user.email}
                </p>
              </div>
            </div>

            <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row">
              <p>© {new Date().getFullYear()} TrustVault</p>
              <p>Designed for secure document management.</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
 