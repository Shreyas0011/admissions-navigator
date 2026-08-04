import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Module 9/10 — exam slots and hall-ticket readiness. */
export async function listExams() {
  const { data, error } = await supabaseAdmin
    .from("exams")
    .select("id, title, centre, capacity, scheduled_at")
    .order("scheduled_at", { ascending: true });
  if (error) throw new Error(error.message);

  const { count, error: countError } = await supabaseAdmin
    .from("students")
    .select("id", { count: "exact", head: true })
    .in("stage", ["EXAM_BOOKED", "HALL_TICKET_GENERATED"]);
  if (countError) throw new Error(countError.message);

  return { exams: data ?? [], examReadyStudents: count ?? 0 };
}
