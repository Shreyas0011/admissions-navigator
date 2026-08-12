import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { BulkRow } from "./bulk.schema";

export type BulkResult = {
  email: string;
  fullName: string;
  status: "CREATED" | "SKIPPED" | "FAILED";
  studentCode?: string;
  password?: string;
  counsellorName?: string | null;
  message?: string;
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Temporary password handed to the student; they must reset it on first login. */
function generatePassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function programmeMap(codes: string[]) {
  const { data } = await supabaseAdmin
    .from("programmes")
    .select("id, code")
    .in("code", Array.from(new Set(codes)));
  return new Map((data ?? []).map((p) => [p.code.toUpperCase(), p.id]));
}

/**
 * Admin bulk import. Each row becomes an auth account + student record, then
 * goes straight through the Assignment Engine like any online application.
 */
export async function importStudents(rows: BulkRow[]): Promise<BulkResult[]> {
  const programmes = await programmeMap(rows.map((r) => r.programme_code));
  const { resolveAssignment } = await import("@/domains/assignment/assignment.service");
  const results: BulkResult[] = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    const base = { email, fullName: row.full_name };

    const programmeId = programmes.get(row.programme_code.trim().toUpperCase());
    if (!programmeId) {
      results.push({ ...base, status: "FAILED", message: `Unknown programme ${row.programme_code}` });
      continue;
    }

    const { data: existing } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      results.push({ ...base, status: "SKIPPED", message: "A student already exists for this email" });
      continue;
    }

    const password = generatePassword();
    const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: row.full_name, is_applicant: true, must_reset_password: true },
    });
    if (authError || !created.user) {
      results.push({ ...base, status: "FAILED", message: authError?.message ?? "Could not create login" });
      continue;
    }

    const { data: student, error } = await supabaseAdmin
      .from("students")
      .insert({
        full_name: row.full_name,
        date_of_birth: row.date_of_birth,
        school: row.school,
        course: row.course,
        programme_id: programmeId,
        parent_name: row.parent_name,
        parent_phone: row.parent_phone,
        email,
        phone: row.phone,
        lead_source: row.lead_source,
        stage: "NEW",
        student_code: "",
        user_id: created.user.id,
      })
      .select("id, student_code")
      .single();

    if (error || !student) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      results.push({ ...base, status: "FAILED", message: error?.message ?? "Could not save student" });
      continue;
    }

    await supabaseAdmin.from("student_events").insert({
      student_id: student.id,
      from_stage: null,
      to_stage: "NEW",
      actor_label: "Bulk import",
      reason: "Imported from spreadsheet",
    });

    let counsellorName: string | null = null;
    try {
      const decision = await resolveAssignment({
        studentId: student.id,
        actorLabel: "Assignment Engine (bulk import)",
      });
      counsellorName = decision.counsellorName;
    } catch {
      // A misconfigured engine must never block an import.
    }

    results.push({
      ...base,
      status: "CREATED",
      studentCode: student.student_code,
      password,
      counsellorName,
    });
  }

  return results;
}
