import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CounsellorStudent = {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  stage: string;
  created_at: string;
  programmes: { name: string } | null;
};

export type CounsellorCall = {
  id: string;
  student_id: string;
  outcome: string;
  notes: string | null;
  called_at: string;
  created_at: string;
};

/** Admin drill-in: one counsellor, their students and every call they logged. */
export async function getCounsellorDetail(counsellorId: string) {
  const { data: counsellor, error } = await supabaseAdmin
    .from("counsellors")
    .select("id, full_name, email, phone, is_active, max_active_leads, must_reset_password")
    .eq("id", counsellorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!counsellor) throw new Error("Counsellor not found");

  const [{ data: students, error: studentError }, { data: calls, error: callError }] =
    await Promise.all([
      supabaseAdmin
        .from("students")
        .select(
          "id, student_code, full_name, email, phone, stage, created_at, programmes(name)",
        )
        .eq("counsellor_id", counsellorId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("call_logs")
        .select("id, student_id, outcome, notes, called_at, created_at")
        .eq("counsellor_id", counsellorId)
        .order("called_at", { ascending: false }),
    ]);
  if (studentError) throw new Error(studentError.message);
  if (callError) throw new Error(callError.message);

  return {
    counsellor,
    students: (students ?? []) as unknown as CounsellorStudent[],
    calls: (calls ?? []) as CounsellorCall[],
  };
}
