
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SignOutButton from "./signout-button";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

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

              <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
                <span>▤</span>
                My Documents
                <span className="ml-auto text-[10px]">Soon</span>
              </div>

              <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
                <span>↗</span>
                Shared with Me
                <span className="ml-auto text-[10px]">Soon</span>
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

            <p className="text-sm font-semibold">Your vault, your control</p>

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
              <p className="mt-1 text-sm font-semibold">Personal Vault</p>
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
                  <p className="text-sm text-slate-400">Document Library</p>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">
                    ▤
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Ready for your files
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your document library will appear here when file management
                  is available.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-6 transition hover:border-indigo-400/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Sharing</p>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-xl text-indigo-300">
                    ↗
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  Share with confidence
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Document sharing will be available as the sharing workflow
                  is implemented.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-6 transition hover:border-emerald-400/20 sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Account Security</p>

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

            {/* Document area */}
            <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020]">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    Recent Documents
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your recently accessed files will appear here.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  title="Document uploads are not implemented yet"
                  className="cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-500"
                >
                  + Upload Document
                </button>
              </div>

              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/5 text-3xl text-cyan-300">
                  ▤
                </div>

                <h3 className="text-lg font-semibold">
                  Your vault is ready
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Your document space is prepared. Once document upload and
                  storage are connected, you will be able to manage your files
                  here.
                </p>
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