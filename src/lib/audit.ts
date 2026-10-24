
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

type AuditEvent = {
  actorId: string;
  documentId?: string | null;
  action: string;
  outcome: "success" | "failure";
  requestId?: string;
  metadata?: Record<string, unknown>;
};

function createAuditClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase audit configuration is missing");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function writeAuditEvent(event: AuditEvent) {
  const supabase = createAuditClient();

  const { error } = await supabase.from("audit_events").insert({
    actor_id: event.actorId,
    document_id: event.documentId ?? null,
    action: event.action,
    outcome: event.outcome,
    request_id: event.requestId ?? randomUUID(),
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.error("Audit event insert failed:", error.message);
    throw new Error("Failed to write audit event");
  }
}