import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Module 6/7 — seminar scheduling and booking rollups. */
export async function listSeminars() {
  const [{ data: seminars, error }, { data: bookings, error: bookingError }] = await Promise.all([
    supabaseAdmin
      .from("seminars")
      .select("id, title, seminar_type, venue, capacity, scheduled_at, is_open")
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin.from("seminar_bookings").select("seminar_id, status"),
  ]);
  if (error) throw new Error(error.message);
  if (bookingError) throw new Error(bookingError.message);

  const booked = new Map<string, number>();
  const attended = new Map<string, number>();
  for (const b of bookings ?? []) {
    booked.set(b.seminar_id, (booked.get(b.seminar_id) ?? 0) + 1);
    if (b.status === "ATTENDED") attended.set(b.seminar_id, (attended.get(b.seminar_id) ?? 0) + 1);
  }

  return (seminars ?? []).map((s) => ({
    ...s,
    booked: booked.get(s.id) ?? 0,
    attended: attended.get(s.id) ?? 0,
  }));
}

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
