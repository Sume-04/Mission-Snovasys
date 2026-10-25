
import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type AuditEvent = {
  actorId: string;
  documentId: string | null;
  action: string;
  outcome: "success" | "failure";
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent({
  actorId,
  documentId,
  action,
  outcome,
  requestId,
  metadata = {},
}: AuditEvent) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("Audit environment check:", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseSecretKey: Boolean(supabaseSecretKey),
    });

    throw new Error("Missing Supabase audit environment variables");
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { error } = await supabase.from("audit_events").insert({
    actor_id: actorId,
    document_id: documentId,
    action,
    outcome,
    request_id: requestId ?? randomUUID(),
    metadata,
  });

  if (error) {
    console.error("Audit event insert failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Failed to write audit event");
  }
}
