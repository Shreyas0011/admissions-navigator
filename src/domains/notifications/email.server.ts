import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type EnqueueEmailArgs = {
  studentId?: string | null;
  to: string;
  templateKey: string;
  subject: string;
  payload?: Record<string, unknown>;
};

/**
 * Module 5/7/8/12 — transactional email.
 *
 * Every module enqueues instead of sending. Delivery is a separate concern:
 * swapping in a real provider means implementing a worker that drains QUEUED
 * rows, with zero changes at any call site.
 */
export async function enqueueEmail(args: EnqueueEmailArgs) {
  const { error } = await supabaseAdmin.from("email_queue").insert({
    student_id: args.studentId ?? null,
    to_email: args.to,
    template_key: args.templateKey,
    subject: args.subject,
    payload: (args.payload ?? {}) as never,
    status: "QUEUED",
  });
  if (error) throw new Error(error.message);
}

export async function listEmails(status?: "QUEUED" | "SENT" | "FAILED" | "CANCELLED") {
  let query = supabaseAdmin
    .from("email_queue")
    .select("id, to_email, template_key, subject, payload, status, attempts, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function emailCounts() {
  const statuses = ["QUEUED", "SENT", "FAILED"] as const;
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabaseAdmin
        .from("email_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw new Error(error.message);
      return [status, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(results) as Record<(typeof statuses)[number], number>;
}
