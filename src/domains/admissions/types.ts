import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AdmissionStage = Database["public"]["Enums"]["admission_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type SeminarType = Database["public"]["Enums"]["seminar_type"];
export type EmailStatus = Database["public"]["Enums"]["email_status"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type CallOutcome = Database["public"]["Enums"]["call_outcome"];

/** The Phase 1 state machine, in order. Index position defines progression. */
export const STAGE_ORDER: AdmissionStage[] = [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "WOC_BOOKED",
  "WOC_ATTENDED",
  "ACC_BOOKED",
  "ACC_ATTENDED",
  "EXAM_BOOKED",
  "HALL_TICKET_GENERATED",
];

export function stageIndex(stage: AdmissionStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * A student may only move forward one step at a time, or be reverted a single
 * step for correction. Every accepted move is recorded in `student_events`.
 */
export function canTransition(from: AdmissionStage, to: AdmissionStage): boolean {
  const delta = stageIndex(to) - stageIndex(from);
  return delta === 1 || delta === -1;
}
