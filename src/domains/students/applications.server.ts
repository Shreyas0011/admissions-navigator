import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ApplicationInput } from "./schema";

/**
 * Module 1b — public application that also creates the applicant's login.
 *
 * One server-side flow: auth user -> student row linked by user_id -> NEW
 * audit event -> welcome email. The applicant signs in client-side with the
 * same credentials immediately afterwards.
 */
export async function createApplicationAccount(input: ApplicationInput) {
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    throw new Error("An application already exists for this email. Please sign in instead.");
  }

  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, is_applicant: true },
  });
  if (authError || !created.user) {
    throw new Error(authError?.message ?? "Could not create your account");
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .insert({
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      school: input.school,
      course: input.course,
      programme_id: input.programmeId,
      parent_name: input.parentName,
      parent_phone: input.parentPhone,
      email,
      phone: input.phone,
      lead_source: input.leadSource,
      stage: "NEW",
      student_code: "",
      user_id: created.user.id,
    })
    .select("id, student_code, full_name, email")
    .single();

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    throw new Error(error.message);
  }

  await supabaseAdmin.from("student_events").insert({
    student_id: data.id,
    from_stage: null,
    to_stage: "NEW",
    actor_label: "Student application portal",
    reason: "Application submitted online",
  });

  const { enqueueEmail } = await import("@/domains/notifications/email.server");
  await enqueueEmail({
    studentId: data.id,
    to: data.email,
    templateKey: "application_received",
    subject: `Application received — ${data.student_code}`,
    payload: { student_code: data.student_code, full_name: data.full_name },
  });

  return { studentCode: data.student_code, studentId: data.id };
}
