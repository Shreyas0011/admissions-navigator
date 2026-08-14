import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ExamConfigRow = {
  event_id: string;
  duration_minutes: number;
  instructions: string;
};

export async function selectExamConfigs(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, ExamConfigRow>();
  const { data, error } = await supabaseAdmin
    .from("exam_configs")
    .select("event_id, duration_minutes, instructions")
    .in("event_id", eventIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.event_id, row as ExamConfigRow]));
}

export async function upsertExamConfig(input: {
  eventId: string;
  durationMinutes: number;
  instructions: string;
}) {
  const { error } = await supabaseAdmin.from("exam_configs").upsert(
    {
      event_id: input.eventId,
      duration_minutes: input.durationMinutes,
      instructions: input.instructions,
    },
    { onConflict: "event_id" },
  );
  if (error) throw new Error(error.message);
}

export async function insertHallTicket(row: {
  student_id: string;
  event_id: string;
  session_id: string;
  booking_id: string;
  ticket_number: string;
  qr_payload: string;
}) {
  const { error } = await supabaseAdmin.from("hall_tickets").insert(row);
  if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
}

export async function selectHallTicketByBooking(bookingId: string) {
  const { data, error } = await supabaseAdmin
    .from("hall_tickets")
    .select("id, ticket_number, student_id, event_id, session_id, booking_id, issued_at")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectBookingForTicket(bookingId: string) {
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .select(
      "id, booking_ref, status, student_id, session_id, event_id, events(title, event_type), event_sessions(starts_at, ends_at, venues(name, campus, building)), students(id, full_name, student_code, email, phone)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as {
    id: string;
    booking_ref: string;
    status: string;
    student_id: string;
    session_id: string | null;
    event_id: string | null;
    events: { title: string; event_type: string } | null;
    event_sessions: {
      starts_at: string;
      ends_at: string;
      venues: { name: string; campus: string; building: string | null } | null;
    } | null;
    students: {
      id: string;
      full_name: string;
      student_code: string;
      email: string;
      phone: string;
    } | null;
  } | null;
}
