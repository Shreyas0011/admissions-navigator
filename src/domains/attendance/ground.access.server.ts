import { createHash } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Ground-staff access is a database-backed opaque token, not a cookie and not a
 * signed blob: several staff phones sign in to the same session at once, iOS
 * partitions cross-site cookies, and preview/production do not share a signing
 * secret. Only the SHA-256 hash of the token is ever stored.
 */
export type GroundPurpose = "SEMINAR" | "EXAM";
export type GroundAccess = { sessionId: string; staffName: string; purpose: GroundPurpose };

const TTL_MS = 12 * 60 * 60 * 1000;

function hash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function issueGroundAccess(
  sessionId: string,
  staffName: string,
  purpose: GroundPurpose,
): Promise<string> {
  const token = newToken();
  const { error } = await supabaseAdmin.from("ground_access_sessions").insert({
    session_id: sessionId,
    token_hash: hash(token),
    staff_name: staffName,
    purpose,
    expires_at: new Date(Date.now() + TTL_MS).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

export async function requireGroundAccess(token?: string | null): Promise<GroundAccess> {
  const expired = new Error("Ground access expired — sign in again");
  if (!token || token.length < 16) throw expired;

  const { data, error } = await supabaseAdmin
    .from("ground_access_sessions")
    .select("session_id, staff_name, purpose, expires_at")
    .eq("token_hash", hash(token))
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || new Date(data.expires_at).getTime() < Date.now()) throw expired;

  return {
    sessionId: data.session_id,
    staffName: data.staff_name,
    purpose: (data.purpose as GroundPurpose) ?? "SEMINAR",
  };
}

export async function revokeGroundAccess(token: string) {
  await supabaseAdmin.from("ground_access_sessions").delete().eq("token_hash", hash(token));
}
