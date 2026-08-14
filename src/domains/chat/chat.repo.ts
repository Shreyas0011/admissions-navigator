import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MessageRow = {
  id: string;
  student_id: string;
  counsellor_id: string;
  sender_type: "STUDENT" | "COUNSELLOR";
  body: string;
  read_at: string | null;
  created_at: string;
};

export async function selectStudentForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, counsellor_id, counsellors(full_name, email)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as
    | {
        id: string;
        full_name: string;
        counsellor_id: string | null;
        counsellors: { full_name: string; email: string } | null;
      }
    | null;
}

export async function selectCounsellorForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("counsellors")
    .select("id, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectAssignedStudent(counsellorId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, counsellor_id")
    .eq("id", studentId)
    .eq("counsellor_id", counsellorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectMessages(studentId: string, counsellorId: string) {
  const { data, error } = await supabaseAdmin
    .from("student_messages")
    .select("id, student_id, counsellor_id, sender_type, body, read_at, created_at")
    .eq("student_id", studentId)
    .eq("counsellor_id", counsellorId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as MessageRow[];
}

export async function insertMessage(row: {
  student_id: string;
  counsellor_id: string;
  sender_type: "STUDENT" | "COUNSELLOR";
  sender_user_id: string;
  body: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("student_messages")
    .insert(row)
    .select("id, student_id, counsellor_id, sender_type, body, read_at, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as MessageRow;
}

export async function markThreadRead(
  studentId: string,
  counsellorId: string,
  readerIs: "STUDENT" | "COUNSELLOR",
) {
  const { error } = await supabaseAdmin
    .from("student_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("counsellor_id", counsellorId)
    .neq("sender_type", readerIs)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}

/** Unread counts per student for one counsellor's inbox. */
export async function selectUnreadForCounsellor(counsellorId: string) {
  const { data, error } = await supabaseAdmin
    .from("student_messages")
    .select("student_id")
    .eq("counsellor_id", counsellorId)
    .eq("sender_type", "STUDENT")
    .is("read_at", null);
  if (error) throw new Error(error.message);
  const map: Record<string, number> = {};
  for (const row of data ?? []) map[row.student_id] = (map[row.student_id] ?? 0) + 1;
  return map;
}
