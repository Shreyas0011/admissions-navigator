import type { AdmissionStage } from "@/domains/admissions/types";
import {
  insertAcademicYear,
  selectAcademicYears,
  selectOpenProgrammes,
  selectProgrammeStudentCounts,
  selectProgrammes,
  selectVenues,
  upsertProgramme,
  upsertVenue,
} from "./programmes.repo";
import type { AcademicYearInput, ProgrammeInput, VenueInput } from "./schema";

const CONVERTED: AdmissionStage[] = ["EXAM_BOOKED", "HALL_TICKET_GENERATED"];

export type ProgrammeSummary = Awaited<ReturnType<typeof selectProgrammes>>[number] & {
  applications: number;
  converted: number;
  fillRate: number;
};

/** Programme registry with live application rollups — the admin's home screen. */
export async function listProgrammes(): Promise<ProgrammeSummary[]> {
  const [programmes, students] = await Promise.all([
    selectProgrammes(),
    selectProgrammeStudentCounts(),
  ]);

  const applications = new Map<string, number>();
  const converted = new Map<string, number>();
  for (const s of students) {
    if (!s.programme_id) continue;
    applications.set(s.programme_id, (applications.get(s.programme_id) ?? 0) + 1);
    if (CONVERTED.includes(s.stage as AdmissionStage)) {
      converted.set(s.programme_id, (converted.get(s.programme_id) ?? 0) + 1);
    }
  }

  return programmes.map((p) => {
    const total = applications.get(p.id) ?? 0;
    return {
      ...p,
      applications: total,
      converted: converted.get(p.id) ?? 0,
      fillRate: Math.round((total / Math.max(p.intake, 1)) * 100),
    };
  });
}

export const listOpenProgrammes = selectOpenProgrammes;
export const listAcademicYears = selectAcademicYears;
export const createAcademicYear = (input: AcademicYearInput) => insertAcademicYear(input);
export const saveProgramme = (input: ProgrammeInput) => upsertProgramme(input);
export const listVenues = selectVenues;
export const saveVenue = (input: VenueInput) => upsertVenue(input);
