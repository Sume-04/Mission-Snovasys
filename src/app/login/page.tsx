
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(action: "login" | "signup") {
    setLoading(true);
    setMessage("");

    try {
      const result =
        action === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setMessage(result.error.message);
      } else if (action === "signup" && !result.data.session) {
        setMessage("Account created. Check your email to confirm your account.");
      } else {
        window.location.href = "/account";
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-3xl font-bold">TrustVault</h1>
      <p className="mt-2 text-gray-600">
        Secure document sharing starts here.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleAuth("login");
        }}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Sign in"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleAuth("signup")}
          className="w-full rounded border p-2 disabled:opacity-50"
        >
          Create account
        </button>
      </form>

      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}
    </main>
  );
}