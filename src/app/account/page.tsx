import SignOutButton from "./signout-button";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">TrustVault Account</h1>

      <p className="mt-4 text-green-700">
        Your session was verified successfully.
      </p>

      <p className="mt-2 text-sm text-gray-600">
        Signed in as: {user.email}
      </p>
      <SignOutButton />
    </main>
  );
}