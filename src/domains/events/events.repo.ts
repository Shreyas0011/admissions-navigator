import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { EventInput, SessionInput } from "./schema";

const EVENT_COLUMNS =
  "id, title, event_type, programme_id, subject, description, allocation_strategy, target_stage, registration_opens_at, registration_closes_at, auto_approve, allow_cancellation, cancellation_cutoff_hours, is_open, created_at";

export type EventRow = {
  id: string;
  title: string;
  event_type: "WOC" | "ACC" | "EXAM" | "OTHER";
  programme_id: string | null;
  subject: string | null;
  description: string | null;
  allocation_strategy: "FIRST_AVAILABLE" | "LEAST_FILLED" | "ROUND_ROBIN" | "MANUAL";
  target_stage: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  auto_approve: boolean;
  allow_cancellation: boolean;
  cancellation_cutoff_hours: number;
  is_open: boolean;
  created_at: string;
  programmes: { name: string; code: string } | null;
};

export type SessionRow = {
  id: string;
  event_id: string;
  venue_id: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  reserved_seats: number;
  waitlist_enabled: boolean;
  waitlist_size: number;
  is_open: boolean;
  venues: { name: string; campus: string } | null;
};

export async function selectEvents(): Promise<EventRow[]> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_COLUMNS + ", programmes(name, code)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EventRow[];
}

export async function selectEvent(id: string): Promise<EventRow | null> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_COLUMNS + ", programmes(name, code)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as EventRow) ?? null;
}

export async function selectSessions(eventIds?: string[]): Promise<SessionRow[]> {
  let query = supabaseAdmin
    .from("event_sessions")
    .select(
      "id, event_id, venue_id, starts_at, ends_at, capacity, reserved_seats, waitlist_enabled, waitlist_size, is_open, venues(name, campus)",
    )
    .order("starts_at");
  if (eventIds) query = query.in("event_id", eventIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SessionRow[];
}

export async function selectSession(id: string) {
  const { data, error } = await supabaseAdmin
    .from("event_sessions")
    .select("id, event_id, capacity, reserved_seats, starts_at, ends_at, is_open, waitlist_enabled")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type BookingRow = {
  id: string;
  session_id: string | null;
  event_id: string | null;
  student_id: string;
  booking_ref: string;
  qr_payload: string;
  status: "BOOKED" | "ATTENDED" | "CANCELLED" | "NO_SHOW";
  booked_at: string;
  students: { full_name: string; student_code: string; email: string } | null;
};

export async function selectBookings(filter: {
  eventId?: string;
  sessionIds?: string[];
  studentId?: string;
}): Promise<BookingRow[]> {
  let query = supabaseAdmin
    .from("seminar_bookings")
    .select(
      "id, session_id, event_id, student_id, booking_ref, qr_payload, status, booked_at, students(full_name, student_code, email)",
    )
    .order("booked_at", { ascending: false });
  if (filter.eventId) query = query.eq("event_id", filter.eventId);
  if (filter.sessionIds) query = query.in("session_id", filter.sessionIds);
  if (filter.studentId) query = query.eq("student_id", filter.studentId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BookingRow[];
}

export async function countSeatsBySession(sessionIds: string[]) {
  if (sessionIds.length === 0) return new Map<string, number>();
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .select("session_id, status")
    .in("session_id", sessionIds)
    .neq("status", "CANCELLED");
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.session_id) continue;
    map.set(row.session_id, (map.get(row.session_id) ?? 0) + 1);
  }
  return map;
}

export async function upsertEvent(input: EventInput) {
  const row = {
    title: input.title,
    event_type: input.eventType,
    programme_id: input.programmeId,
    subject: input.subject || null,
    description: input.description || null,
    allocation_strategy: input.allocationStrategy,
    target_stage: input.targetStage,
    registration_opens_at: input.registrationOpensAt || null,
    registration_closes_at: input.registrationClosesAt || null,
    auto_approve: input.autoApprove,
    allow_cancellation: input.allowCancellation,
    cancellation_cutoff_hours: input.cancellationCutoffHours,
    is_open: input.isOpen,
  };
  const { data, error } = input.id
    ? await supabaseAdmin.from("events").update(row).eq("id", input.id).select("id").single()
    : await supabaseAdmin.from("events").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function setEventOpen(id: string, isOpen: boolean) {
  const { error } = await supabaseAdmin.from("events").update({ is_open: isOpen }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertSession(input: SessionInput) {
  const row = {
    event_id: input.eventId,
    venue_id: input.venueId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    capacity: input.capacity,
    reserved_seats: input.reservedSeats,
    waitlist_enabled: input.waitlistEnabled,
    waitlist_size: input.waitlistSize,
    is_open: input.isOpen,
  };
  const { error } = input.id
    ? await supabaseAdmin.from("event_sessions").update(row).eq("id", input.id)
    : await supabaseAdmin.from("event_sessions").insert(row);
  if (error) throw new Error(error.message);
}

export async function insertBooking(row: {
  session_id: string;
  event_id: string;
  student_id: string;
  booking_ref: string;
  qr_payload: string;
  seminar_id: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("seminar_bookings")
    .insert({ ...row, status: "BOOKED" })
    .select("id, booking_ref, qr_payload")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function cancelBookingRow(id: string) {
  const { error } = await supabaseAdmin
    .from("seminar_bookings")
    .update({ status: "CANCELLED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
