import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { canTransition } from "@/domains/admissions/types";
import type { AdmissionStage } from "@/domains/admissions/types";
import type { EnquiryInput, RegistryQuery } from "./schema";

export type StudentRow = {
  id: string;
  student_code: string;
  full_name: string;
  date_of_birth: string | null;
  school: string | null;
  course: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  email: string;
  phone: string;
  lead_source: string;
  stage: AdmissionStage;
  counsellor_id: string | null;
  created_at: string;
  counsellor_name: string | null;
};

export type RegistryResult = {
  rows: StudentRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: { totalActive: number; wocPending: number; newLeads: number; unassigned: number };
};

type RawStudent = Omit<StudentRow, "counsellor_name"> & {
  counsellors: { full_name: string } | null;
};

const REGISTRY_COLUMNS =
  "id, student_code, full_name, date_of_birth, school, course, parent_name, parent_phone, email, phone, lead_source, stage, counsellor_id, created_at, counsellors(full_name)";

/** Module 2 — server-side filtering, sorting and pagination for the registry. */
export async function queryRegistry(input: RegistryQuery): Promise<RegistryResult> {
  const offset = (input.page - 1) * input.pageSize;

  let query = supabaseAdmin
    .from("students")
    .select(REGISTRY_COLUMNS, { count: "exact" })
    .order(input.sortBy, { ascending: input.order === "asc" })
    .range(offset, offset + input.pageSize - 1);

  if (input.search) {
    const term = `%${input.search.replace(/[%,()]/g, "")}%`;
    query = query.or(
      `full_name.ilike.${term},student_code.ilike.${term},email.ilike.${term},phone.ilike.${term}`,
    );
  }
  if (input.stage) query = query.eq("stage", input.stage);
  if (input.counsellorId) query = query.eq("counsellor_id", input.counsellorId);
  if (input.from) query = query.gte("created_at", input.from);
  if (input.to) query = query.lte("created_at", input.to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows: StudentRow[] = ((data ?? []) as unknown as RawStudent[]).map((r) => {
    const { counsellors, ...rest } = r;
    return { ...rest, counsellor_name: counsellors?.full_name ?? null };
  });

  return { rows, total: count ?? 0, page: input.page, pageSize: input.pageSize, stats: await registryStats() };
}

async function countStudents(
  build: (
    q: ReturnType<typeof baseCount>,
  ) => PromiseLike<{ count: number | null; error: { message: string } | null }>,
) {
  const { count, error } = await build(baseCount());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function baseCount() {
  return supabaseAdmin.from("students").select("id", { count: "exact", head: true });
}

export async function registryStats() {
  const [totalActive, wocPending, newLeads, unassigned] = await Promise.all([
    countStudents((q) => q.neq("stage", "HALL_TICKET_GENERATED")),
    countStudents((q) => q.in("stage", ["ASSIGNED", "CONTACTED", "WOC_BOOKED"])),
    countStudents((q) => q.eq("stage", "NEW")),
    countStudents((q) => q.is("counsellor_id", null)),
  ]);
  return { totalActive, wocPending, newLeads, unassigned };
}

export async function getStudentById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select(REGISTRY_COLUMNS + ", notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const raw = data as unknown as RawStudent & { notes: string | null };
  const { counsellors, ...rest } = raw;
  return { ...rest, counsellor_name: counsellors?.full_name ?? null };
}

export async function getStudentTimeline(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("student_events")
    .select("id, from_stage, to_stage, actor_label, reason, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Module 1 — create an enquiry, record the NEW event, enqueue the welcome email. */
export async function createEnquiry(input: EnquiryInput) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .insert({
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      school: input.school,
      course: input.course,
      parent_name: input.parentName,
      parent_phone: input.parentPhone,
      email: input.email,
      phone: input.phone,
      lead_source: input.leadSource,
      stage: "NEW",
      student_code: "",
    })
    .select("id, student_code, full_name, email")
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin.from("student_events").insert({
    student_id: data.id,
    from_stage: null,
    to_stage: "NEW",
    actor_label: "Public enquiry portal",
    reason: `Enquiry submitted via ${input.leadSource.toLowerCase().replace("_", " ")}`,
  });

  const { enqueueEmail } = await import("@/domains/notifications/email.server");
  await enqueueEmail({
    studentId: data.id,
    to: data.email,
    templateKey: "welcome_enquiry",
    subject: `We received your enquiry, ${data.full_name.split(" ")[0]}`,
    payload: { student_code: data.student_code, full_name: data.full_name },
  });

  return { studentCode: data.student_code, studentId: data.id };
}

/**
 * The only path that changes a student's stage. Validates the move against the
 * state machine and appends an immutable audit event.
 */
export async function transitionStage(args: {
  studentId: string;
  toStage: AdmissionStage;
  actorId: string;
  actorLabel: string;
  reason?: string;
}) {
  const { data: current, error: readError } = await supabaseAdmin
    .from("students")
    .select("stage")
    .eq("id", args.studentId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!current) throw new Error("Student not found");

  const from = current.stage as AdmissionStage;
  if (from === args.toStage) return { from, to: args.toStage, changed: false };
  if (!canTransition(from, args.toStage)) {
    throw new Error(`Cannot move a student from ${from} straight to ${args.toStage}`);
  }

  const { error: updateError } = await supabaseAdmin
    .from("students")
    .update({ stage: args.toStage })
    .eq("id", args.studentId);
  if (updateError) throw new Error(updateError.message);

  await supabaseAdmin.from("student_events").insert({
    student_id: args.studentId,
    from_stage: from,
    to_stage: args.toStage,
    actor_id: args.actorId,
    actor_label: args.actorLabel,
    reason: args.reason ?? null,
  });

  return { from, to: args.toStage, changed: true };
}

/** Module 3 — manual lead assignment. Moves NEW leads to ASSIGNED. */
export async function assignCounsellor(args: {
  studentId: string;
  counsellorId: string | null;
  actorId: string;
  actorLabel: string;
}) {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("stage")
    .eq("id", args.studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!student) throw new Error("Student not found");

  const { error: updateError } = await supabaseAdmin
    .from("students")
    .update({ counsellor_id: args.counsellorId })
    .eq("id", args.studentId);
  if (updateError) throw new Error(updateError.message);

  if (args.counsellorId && student.stage === "NEW") {
    await transitionStage({
      studentId: args.studentId,
      toStage: "ASSIGNED",
      actorId: args.actorId,
      actorLabel: args.actorLabel,
      reason: "Counsellor assigned",
    });
  }
  return { ok: true };
}
