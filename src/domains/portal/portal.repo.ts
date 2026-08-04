import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PortalStudent = {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  stage: string;
  created_at: string;
  programme_id: string | null;
  counsellor_id: string | null;
  programmes: { id: string; name: string; code: string; department: string } | null;
  counsellors: { full_name: string; email: string; phone: string | null } | null;
};

export async function selectStudentByUser(userId: string): Promise<PortalStudent | null> {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select(
      "id, student_code, full_name, email, phone, stage, created_at, programme_id, counsellor_id, programmes(id, name, code, department), counsellors(full_name, email, phone)",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as PortalStudent | null;
}

export async function selectStudentBookings(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .select(
      "id, booking_ref, qr_payload, status, booked_at, session_id, event_id, events(title, event_type), event_sessions(starts_at, ends_at, venues(name, campus))",
    )
    .eq("student_id", studentId)
    .order("booked_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    booking_ref: string;
    qr_payload: string;
    status: string;
    booked_at: string;
    session_id: string | null;
    event_id: string | null;
    events: { title: string; event_type: string } | null;
    event_sessions: {
      starts_at: string;
      ends_at: string;
      venues: { name: string; campus: string } | null;
    } | null;
  }[];
}
