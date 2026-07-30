import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CounsellorRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  max_active_leads: number;
  active_leads: number;
};

/** Module 3 — counsellor directory with live workload. */
export async function listCounsellorsWithWorkload(): Promise<CounsellorRow[]> {
  const [{ data: counsellors, error }, { data: students, error: studentError }] = await Promise.all([
    supabaseAdmin
      .from("counsellors")
      .select("id, full_name, email, phone, is_active, max_active_leads")
      .order("full_name"),
    supabaseAdmin
      .from("students")
      .select("counsellor_id")
      .neq("stage", "HALL_TICKET_GENERATED")
      .not("counsellor_id", "is", null),
  ]);

  if (error) throw new Error(error.message);
  if (studentError) throw new Error(studentError.message);

  const workload = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.counsellor_id) continue;
    workload.set(s.counsellor_id, (workload.get(s.counsellor_id) ?? 0) + 1);
  }

  return (counsellors ?? []).map((c) => ({ ...c, active_leads: workload.get(c.id) ?? 0 }));
}
