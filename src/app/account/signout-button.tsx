
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      alert("Could not sign out. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="mt-6 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
