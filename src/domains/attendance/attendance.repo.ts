import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type DaySessionRow = {
  id: string;
  event_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  reserved_seats: number;
  is_open: boolean;
  ground_password: string | null;
  venues: { name: string; campus: string } | null;
  events: { id: string; title: string; event_type: string; is_open: boolean } | null;
};

const SESSION_COLUMNS =
  "id, event_id, starts_at, ends_at, capacity, reserved_seats, is_open, ground_password, venues(name, campus), events(id, title, event_type, is_open)";

/** Sessions of published events whose start falls inside the given local day. */
export async function selectSessionsBetween(fromIso: string, toIso: string) {
  const { data, error } = await supabaseAdmin
    .from("event_sessions")
    .select(SESSION_COLUMNS)
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as DaySessionRow[]).filter((s) => s.events?.is_open);
}

export async function selectDaySession(id: string): Promise<DaySessionRow | null> {
  const { data, error } = await supabaseAdmin
    .from("event_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as DaySessionRow) ?? null;
}

export async function updateGroundPassword(sessionId: string, password: string | null) {
  const { error } = await supabaseAdmin
    .from("event_sessions")
    .update({ ground_password: password })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export type AttendanceRow = {
  id: string;
  student_id: string;
  booking_id: string | null;
  session_id: string | null;
  is_walk_in: boolean;
  staff_name: string | null;
  scanned_at: string;
  students: { full_name: string; student_code: string; email: string; phone: string } | null;
};

export async function selectAttendance(sessionId: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select(
      "id, student_id, booking_id, session_id, is_walk_in, staff_name, scanned_at, students(full_name, student_code, email, phone)",
    )
    .eq("session_id", sessionId)
    .order("scanned_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AttendanceRow[];
}

export async function insertAttendance(row: {
  student_id: string;
  booking_id: string | null;
  session_id: string;
  seminar_id: string | null;
  programme_id: string | null;
  is_walk_in: boolean;
  staff_name: string;
  scanned_by: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectStudentBrief(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, student_code, email, phone, programme_id, stage")
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectSessionBooking(sessionId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .select("id, booking_ref, status, student_id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .neq("status", "CANCELLED")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function markBookingAttended(bookingId: string) {
  const { error } = await supabaseAdmin
    .from("seminar_bookings")
    .update({ status: "ATTENDED" })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);
}

export async function selectSessionBookings(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .select(
      "id, booking_ref, status, student_id, booked_at, students(full_name, student_code, email, phone)",
    )
    .eq("session_id", sessionId)
    .neq("status", "CANCELLED")
    .order("booked_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    booking_ref: string;
    status: string;
    student_id: string;
    booked_at: string;
    students: {
      full_name: string;
      student_code: string;
      email: string;
      phone: string;
    } | null;
  }[];
}
