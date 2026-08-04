import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CallLogInput } from "@/domains/students/schema";

export async function currentCounsellorId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("counsellors")
    .select("id, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Counsellor portal — the leads owned by the signed-in counsellor. */
export async function listMyLeads(userId: string) {
  const counsellor = await currentCounsellorId(userId);
  if (!counsellor) return { counsellor: null, leads: [] as MyLead[] };

  const { data, error } = await supabaseAdmin
    .from("students")
    .select(
      "id, student_code, full_name, email, phone, stage, created_at, programmes(name), call_logs(id, outcome, notes, created_at)",
    )
    .eq("counsellor_id", counsellor.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  return { counsellor, leads: (data ?? []) as unknown as MyLead[] };
}

export type MyLead = {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  stage: string;
  created_at: string;
  programmes: { name: string } | null;
  call_logs: { id: string; outcome: string; notes: string | null; created_at: string }[];
};

export async function logCall(userId: string, input: CallLogInput) {
  const counsellor = await currentCounsellorId(userId);
  const { error } = await supabaseAdmin.from("call_logs").insert({
    student_id: input.studentId,
    counsellor_id: counsellor?.id ?? null,
    outcome: input.outcome,
    notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
