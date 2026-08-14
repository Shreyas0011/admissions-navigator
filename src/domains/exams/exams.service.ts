import { listEvents } from "@/domains/events/events.service";
import { registerForSession } from "@/domains/portal/portal.service";
import { buildStudentQrPayload } from "@/lib/qr";
import { selectStudentByUser } from "@/domains/portal/portal.repo";
import {
  insertHallTicket,
  selectBookingForTicket,
  selectExamConfigs,
  selectHallTicketByBooking,
  upsertExamConfig,
} from "./exams.repo";

const DEFAULT_INSTRUCTIONS =
  "Carry your Aadhaar card for identity verification along with a printed copy of this hall ticket. Reporting time is 30 minutes before the exam start time.";

/** Admin: every EXAM event with its sessions, seats and exam configuration. */
export async function listExamEvents() {
  const events = (await listEvents()).filter((e) => e.event_type === "EXAM");
  const configs = await selectExamConfigs(events.map((e) => e.id));
  return events.map((event) => ({
    ...event,
    config: configs.get(event.id) ?? {
      event_id: event.id,
      duration_minutes: 90,
      instructions: DEFAULT_INSTRUCTIONS,
    },
  }));
}

export async function saveExamConfig(input: {
  eventId: string;
  durationMinutes: number;
  instructions: string;
}) {
  await upsertExamConfig({
    ...input,
    instructions: input.instructions.trim() || DEFAULT_INSTRUCTIONS,
  });
  return { ok: true as const };
}

function ticketNumber() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `HT-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Student self-registration for an exam session, which issues a hall ticket. */
export async function registerForExam(userId: string, sessionId: string) {
  const booking = await registerForSession(userId, sessionId);
  const student = await selectStudentByUser(userId);
  if (!student) throw new Error("No application is linked to this account");

  const full = await selectBookingForTicket(booking.id);
  if (!full?.event_id || !full.session_id) throw new Error("Exam booking could not be completed");

  await insertHallTicket({
    student_id: student.id,
    event_id: full.event_id,
    session_id: full.session_id,
    booking_id: booking.id,
    ticket_number: ticketNumber(),
    qr_payload: buildStudentQrPayload(student.id, student.full_name),
  });

  return { bookingId: booking.id };
}

/** Hall ticket for one booking — only the owning student may read it. */
export async function getHallTicket(userId: string, bookingId: string) {
  const student = await selectStudentByUser(userId);
  if (!student) throw new Error("No application is linked to this account");

  const booking = await selectBookingForTicket(bookingId);
  if (!booking || booking.student_id !== student.id) throw new Error("Hall ticket not found");
  if (booking.status === "CANCELLED") throw new Error("This registration was cancelled");
  if (booking.events?.event_type !== "EXAM") throw new Error("This booking is not an exam");

  let ticket = await selectHallTicketByBooking(bookingId);
  if (!ticket && booking.event_id && booking.session_id) {
    await insertHallTicket({
      student_id: student.id,
      event_id: booking.event_id,
      session_id: booking.session_id,
      booking_id: booking.id,
      ticket_number: ticketNumber(),
      qr_payload: buildStudentQrPayload(student.id, student.full_name),
    });
    ticket = await selectHallTicketByBooking(bookingId);
  }

  const configs = await selectExamConfigs(booking.event_id ? [booking.event_id] : []);
  const config = booking.event_id ? configs.get(booking.event_id) : undefined;
  const startsAt = booking.event_sessions?.starts_at ?? null;

  return {
    ticketNumber: ticket?.ticket_number ?? "PENDING",
    bookingRef: booking.booking_ref,
    student: {
      id: student.id,
      fullName: student.full_name,
      studentCode: student.student_code,
      phone: student.phone,
      email: student.email,
    },
    qrPayload: buildStudentQrPayload(student.id, student.full_name),
    exam: {
      title: booking.events?.title ?? "Entrance exam",
      startsAt,
      reportingAt: startsAt ? new Date(new Date(startsAt).getTime() - 30 * 60000).toISOString() : null,
      durationMinutes: config?.duration_minutes ?? 90,
      instructions: config?.instructions ?? DEFAULT_INSTRUCTIONS,
      venue: booking.event_sessions?.venues
        ? [
            booking.event_sessions.venues.name,
            booking.event_sessions.venues.building,
            booking.event_sessions.venues.campus,
          ]
            .filter(Boolean)
            .join(" · ")
        : "Venue to be confirmed",
    },
  };
}
