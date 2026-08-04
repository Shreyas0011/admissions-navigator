import { canTransition, type AdmissionStage } from "@/domains/admissions/types";
import {
  cancelBookingRow,
  countSeatsBySession,
  insertBooking,
  selectBookings,
  selectEvent,
  selectEvents,
  selectSession,
  selectSessions,
  setEventOpen,
  upsertEvent,
  upsertSession,
  type EventRow,
  type SessionRow,
} from "./events.repo";
import type { EventInput, SessionInput } from "./schema";

export type SessionSummary = SessionRow & { booked: number; seatsLeft: number };
export type EventSummary = EventRow & {
  sessions: SessionSummary[];
  capacity: number;
  booked: number;
};

function decorate(events: EventRow[], sessions: SessionRow[], seats: Map<string, number>) {
  return events.map((event) => {
    const own = sessions
      .filter((s) => s.event_id === event.id)
      .map((s) => {
        const booked = seats.get(s.id) ?? 0;
        return { ...s, booked, seatsLeft: Math.max(s.capacity - s.reserved_seats - booked, 0) };
      });
    return {
      ...event,
      sessions: own,
      capacity: own.reduce((sum, s) => sum + s.capacity, 0),
      booked: own.reduce((sum, s) => sum + s.booked, 0),
    };
  });
}

export async function listEvents(): Promise<EventSummary[]> {
  const events = await selectEvents();
  const sessions = await selectSessions(events.map((e) => e.id));
  const seats = await countSeatsBySession(sessions.map((s) => s.id));
  return decorate(events, sessions, seats);
}

export async function getEventDetail(id: string) {
  const event = await selectEvent(id);
  if (!event) throw new Error("Event not found");
  const sessions = await selectSessions([id]);
  const seats = await countSeatsBySession(sessions.map((s) => s.id));
  const bookings = await selectBookings({ eventId: id });
  return { event: decorate([event], sessions, seats)[0]!, bookings };
}

export const saveEvent = (input: EventInput) => upsertEvent(input);
export const saveSession = (input: SessionInput) => upsertSession(input);
export const publishEvent = (id: string, isOpen: boolean) => setEventOpen(id, isOpen);

function reference(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const STAGE_FOR_TYPE: Record<string, AdmissionStage | null> = {
  WOC: "WOC_BOOKED",
  ACC: "ACC_BOOKED",
  EXAM: "EXAM_BOOKED",
  OTHER: null,
};

/** Registration window + capacity gate, shared by self-service and staff booking. */
export async function bookSession(args: {
  sessionId: string;
  studentId: string;
  actorId: string | null;
  actorLabel: string;
}) {
  const session = await selectSession(args.sessionId);
  if (!session) throw new Error("Session not found");
  const event = await selectEvent(session.event_id);
  if (!event) throw new Error("Event not found");

  if (!event.is_open) throw new Error("Registration for this event is closed");
  if (!session.is_open) throw new Error("This session is closed");
  if (new Date(session.starts_at).getTime() < Date.now()) throw new Error("This session has passed");

  const now = Date.now();
  if (event.registration_opens_at && new Date(event.registration_opens_at).getTime() > now) {
    throw new Error("Registration has not opened yet");
  }
  if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() < now) {
    throw new Error("Registration has closed");
  }

  const existing = await selectBookings({ eventId: event.id, studentId: args.studentId });
  if (existing.some((b) => b.status !== "CANCELLED")) {
    throw new Error("You already have a booking for this event");
  }

  const seats = await countSeatsBySession([session.id]);
  const booked = seats.get(session.id) ?? 0;
  if (booked >= session.capacity - session.reserved_seats) {
    throw new Error("This session is full");
  }

  const bookingRef = reference(event.event_type);
  const booking = await insertBooking({
    session_id: session.id,
    event_id: event.id,
    student_id: args.studentId,
    booking_ref: bookingRef,
    qr_payload: JSON.stringify({ ref: bookingRef, session: session.id, student: args.studentId }),
    seminar_id: null,
  });

  await advanceAndNotify({
    studentId: args.studentId,
    eventType: event.event_type,
    eventTitle: event.title,
    bookingRef,
    startsAt: session.starts_at,
    actorId: args.actorId,
    actorLabel: args.actorLabel,
  });

  return booking;
}

async function advanceAndNotify(args: {
  studentId: string;
  eventType: string;
  eventTitle: string;
  bookingRef: string;
  startsAt: string;
  actorId: string | null;
  actorLabel: string;
}) {
  const target = STAGE_FOR_TYPE[args.eventType] ?? null;
  const { getStudentById, transitionStage } = await import("@/domains/students/students.server");
  const student = await getStudentById(args.studentId);
  if (!student) return;

  if (target && canTransition(student.stage as AdmissionStage, target)) {
    await transitionStage({
      studentId: args.studentId,
      toStage: target,
      actorId: args.actorId,
      actorLabel: args.actorLabel,
      reason: `Registered for ${args.eventTitle}`,
    });
  }

  const { enqueueEmail } = await import("@/domains/notifications/email.server");
  await enqueueEmail({
    studentId: args.studentId,
    to: student.email,
    templateKey: "seminar_booking_confirmed",
    subject: `Your seat is confirmed for ${args.eventTitle}`,
    payload: {
      booking_ref: args.bookingRef,
      starts_at: args.startsAt,
      full_name: student.full_name,
    },
  });
}

export async function cancelBooking(args: { bookingId: string; studentId?: string }) {
  const bookings = await selectBookings({ studentId: args.studentId });
  const booking = bookings.find((b) => b.id === args.bookingId);
  if (args.studentId && !booking) throw new Error("Booking not found");
  await cancelBookingRow(args.bookingId);
  return { ok: true };
}
