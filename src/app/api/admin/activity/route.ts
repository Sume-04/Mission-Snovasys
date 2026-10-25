
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Authenticate the current user using their session.
    const sessionSupabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    // Use the server-side secret to verify admin status.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("Missing Supabase admin environment variables.");

      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: admin, error: adminError } = await adminSupabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin verification failed:", adminError.message);

      return NextResponse.json(
        { error: "Could not verify administrator access." },
        { status: 500 },
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      );
    }

    // Return the latest audit events to the verified administrator.
    const { data: events, error: eventsError } = await adminSupabase
      .from("audit_events")
      .select(
        "id, actor_id, document_id, action, outcome, request_id, metadata, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (eventsError) {
      console.error("Unable to load audit events:", eventsError.message);

      return NextResponse.json(
        { error: "Unable to load activity." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      events: events ?? [],
    });
  } catch (error) {
    console.error("Admin activity API failed:", error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
