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

const STUDENT_COLUMNS =
  "id, student_code, full_name, email, phone, stage, created_at, programme_id, counsellor_id, programmes(id, name, code, department), counsellors(full_name, email, phone)";

export async function selectStudentByUser(userId: string): Promise<PortalStudent | null> {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as unknown as PortalStudent;

  // Fallback: the auth account exists but was never linked to its student row.
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email?.toLowerCase();
  if (!email) return null;

  const { data: byEmail, error: emailError } = await supabaseAdmin
    .from("students")
    .update({ user_id: userId })
    .is("user_id", null)
    .ilike("email", email)
    .select(STUDENT_COLUMNS)
    .maybeSingle();
  if (emailError) throw new Error(emailError.message);
  return (byEmail ?? null) as unknown as PortalStudent | null;
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
