import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AcademicYearInput, ProgrammeInput, VenueInput } from "./schema";

const PROGRAMME_COLUMNS =
  "id, code, name, department, intake, duration, description, status, academic_year_id, applications_open_at, applications_close_at, created_at";

export type ProgrammeRow = {
  id: string;
  code: string;
  name: string;
  department: string;
  intake: number;
  duration: string | null;
  description: string | null;
  status: "DRAFT" | "OPEN" | "CLOSED";
  academic_year_id: string | null;
  applications_open_at: string | null;
  applications_close_at: string | null;
  created_at: string;
  academic_years: { label: string } | null;
};

export async function selectProgrammes(): Promise<ProgrammeRow[]> {
  const { data, error } = await supabaseAdmin
    .from("programmes")
    .select(PROGRAMME_COLUMNS + ", academic_years(label)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProgrammeRow[];
}


export async function selectOpenProgrammes() {
  const { data, error } = await supabaseAdmin
    .from("programmes")
    .select("id, code, name, department")
    .eq("status", "OPEN")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectProgrammeStudentCounts() {
  const { data, error } = await supabaseAdmin.from("students").select("programme_id, stage");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProgramme(input: ProgrammeInput) {
  const row = {
    code: input.code,
    name: input.name,
    department: input.department,
    academic_year_id: input.academicYearId ?? null,
    intake: input.intake,
    duration: input.duration ?? null,
    description: input.description ?? null,
    status: input.status,
    applications_open_at: input.applicationsOpenAt || null,
    applications_close_at: input.applicationsCloseAt || null,
  };

  const query = input.id
    ? supabaseAdmin.from("programmes").update(row).eq("id", input.id)
    : supabaseAdmin.from("programmes").insert(row);

  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function selectAcademicYears() {
  const { data, error } = await supabaseAdmin
    .from("academic_years")
    .select("id, label, starts_on, ends_on, is_active")
    .order("starts_on", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertAcademicYear(input: AcademicYearInput) {
  const { error } = await supabaseAdmin
    .from("academic_years")
    .insert({ label: input.label, starts_on: input.startsOn, ends_on: input.endsOn });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function selectVenues() {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("id, name, campus, building, floor, capacity, facilities, priority, is_active")
    .order("priority")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertVenue(input: VenueInput) {
  const row = {
    name: input.name,
    campus: input.campus,
    building: input.building ?? null,
    floor: input.floor ?? null,
    capacity: input.capacity,
    facilities: input.facilities,
    is_active: input.isActive,
  };
  const query = input.id
    ? supabaseAdmin.from("venues").update(row).eq("id", input.id)
    : supabaseAdmin.from("venues").insert(row);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}
