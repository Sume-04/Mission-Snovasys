
"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error",
  );
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    setLoading(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();

    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessageType("error");
        setMessage(result.error.message);
      } else if (mode === "signup" && !result.data.session) {
        setMessageType("success");
        setMessage(
          "Your account has been created. Please check your email to confirm your account.",
        );
      } else {
        window.location.href = "/account";
      }
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B18] px-4 py-8 text-white sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1020]/90 shadow-2xl shadow-black/30 lg:grid-cols-2">
        {/* Branding panel */}
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-[#101B35] via-[#0D1730] to-[#080D1D] p-10 lg:flex xl:p-14">
          <div className="absolute -right-20 top-32 h-72 w-72 rounded-full border border-cyan-400/10" />
          <div className="absolute -right-10 top-42 h-52 w-52 rounded-full border border-cyan-400/10" />
          <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
              T
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Trust<span className="text-cyan-400">Vault</span>
            </span>
          </Link>

          <div className="relative">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path
                  d="M12 3L20 6V11.5C20 16.2 16.7 20.1 12 21C7.3 20.1 4 16.2 4 11.5V6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15.5 9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Your digital safe space
            </p>

            <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Your documents.
              <span className="mt-2 block text-cyan-400">
                Your control.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Keep your important documents organized and access your personal
              vault through your secure account.
            </p>

            <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-300">
                ✓
              </span>
              Designed with privacy and access control in mind
            </div>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} TrustVault. All rights reserved.
          </p>
        </section>

        {/* Authentication panel */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300 lg:hidden"
            >
              <span className="text-lg">←</span>
              Back to home
            </Link>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl font-black text-cyan-400 lg:hidden">
                T
              </div>

              <p className="mb-3 text-sm font-medium text-cyan-400">
                Welcome to TrustVault
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {mode === "login"
                  ? "Sign in to access your personal document vault."
                  : "Create an account to get started with your personal vault."}
              </p>
            </div>

            {/* Mode switch */}
            <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => changeMode("signup")}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleAuth();
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ✉
                  </span>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080D1B] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    ◈
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    placeholder="Enter your password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080D1B] py-3.5 pl-11 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition hover:text-cyan-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters.
                </p>
              </div>

              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                    messageType === "success"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In to TrustVault"
                    : "Create My Account"}

                {!loading && (
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              {mode === "login"
                ? "New to TrustVault? "
                : "Already have an account? "}

              <button
                type="button"
                onClick={() =>
                  changeMode(mode === "login" ? "signup" : "login")
                }
                className="font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="text-cyan-400">◈</span>
              Secure access to your personal vault
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}