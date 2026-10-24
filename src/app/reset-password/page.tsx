
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error",
  );

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function checkRecoverySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setValidSession(false);
        setMessage(
          "This password reset link is invalid or has expired. Please request a new one.",
        );
        setMessageType("error");
      } else {
        setValidSession(true);
      }

      setCheckingSession(false);
    }

    void checkRecoverySession();
  }, []);

  async function handleUpdatePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessageType("error");
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      setPasswordUpdated(true);
      setMessageType("success");
      setMessage("Your password has been reset successfully.");

      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B18] px-4 py-8 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#0B1020]/90 p-6 shadow-2xl shadow-black/30 sm:p-10">
        {/* Branding */}
        <Link href="/" className="mb-10 inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
            T
          </div>

          <span className="text-2xl font-bold tracking-tight">
            Trust<span className="text-cyan-400">Vault</span>
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
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

          <p className="mb-3 text-sm font-medium text-cyan-400">
            Account Recovery
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {passwordUpdated ? "Password updated" : "Reset your password"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {passwordUpdated
              ? "Your TrustVault password has been changed. You can now sign in using your new password."
              : "Create a new password for your TrustVault account."}
          </p>
        </div>

        {/* Session loading */}
        {checkingSession ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm text-slate-400">
            Verifying your password reset link...
          </div>
        ) : passwordUpdated ? (
          <div className="space-y-5">
            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-300"
              >
                {message}
              </div>
            )}

            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Back to Sign In
            </Link>
          </div>
        ) : !validSession ? (
          <div className="space-y-5">
            {message && (
              <div
                role="status"
                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-300"
              >
                {message}
              </div>
            )}

            <Link
              href="/forgot-password"
              className="flex w-full items-center justify-center rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Request a New Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#080D1B] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080D1B] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 transition hover:text-cyan-300"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Feedback */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating password..." : "Update Password"}

              {!loading && (
                <span className="transition group-hover:translate-x-1">
                  →
                </span>
              )}
            </button>
          </form>
        )}

        {/* Back to login */}
        {!passwordUpdated && (
          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              <span>←</span>
              Back to Sign In
            </Link>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="text-cyan-400">◈</span>
          Secure access to your personal vault
        </div>
      </div>
    </main>
  );
}
