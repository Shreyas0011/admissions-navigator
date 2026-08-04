import { getStudentById, getStudentTimeline } from "./students.server";
import { selectStudentAssignments } from "@/domains/assignment/policies.repo";
import { selectStudentBookings } from "@/domains/portal/portal.repo";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Admin 360° view of one applicant: programme, progress, counsellor, bookings. */
export async function getStudentDetail(id: string) {
  const [student, timeline, assignments, bookings] = await Promise.all([
    getStudentById(id),
    getStudentTimeline(id),
    selectStudentAssignments(id),
    selectStudentBookings(id),
  ]);
  if (!student) throw new Error("Student not found");

  const { data: programmeRow } = await supabaseAdmin
    .from("students")
    .select("programme_id, programmes(name, code, department)")
    .eq("id", id)
    .maybeSingle();

  const programme = (programmeRow as unknown as {
    programmes: { name: string; code: string; department: string } | null;
  } | null)?.programmes ?? null;

  return { student, timeline, assignments, bookings, programme };
}
