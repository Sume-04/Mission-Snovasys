
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLoading(false);
        alert("Could not sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-label="Sign out of TrustVault"
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/15 bg-rose-400/5 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M10 17L15 12L10 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 12H3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}