import { STAGE_ORDER, type AdmissionStage } from "@/domains/admissions/types";
import { listEvents, bookSession } from "@/domains/events/events.service";
import { getStudentTimeline } from "@/domains/students/students.server";
import { selectStudentBookings, selectStudentByUser } from "./portal.repo";

async function requireStudent(userId: string) {
  const student = await selectStudentByUser(userId);
  if (!student) throw new Error("No application is linked to this account");
  return student;
}

/** Everything the portal home + progress + counsellor tabs need in one read. */
export async function getMyApplication(userId: string) {
  const student = await requireStudent(userId);
  const [timeline, bookings] = await Promise.all([
    getStudentTimeline(student.id),
    selectStudentBookings(student.id),
  ]);

  const reached = new Set(timeline.map((t) => t.to_stage as AdmissionStage));
  reached.add(student.stage as AdmissionStage);
  const currentIndex = STAGE_ORDER.indexOf(student.stage as AdmissionStage);

  return {
    student,
    bookings,
    timeline,
    progress: STAGE_ORDER.map((stage, index) => ({
      stage,
      reached: reached.has(stage) || index < currentIndex,
      current: index === currentIndex,
      at: timeline.find((t) => t.to_stage === stage)?.created_at ?? null,
    })),
  };
}

/**
 * Self-service catalogue: only published events for the student's programme
 * whose target stage they have reached, with live seat counts.
 */
export async function listMySessions(userId: string) {
  const student = await requireStudent(userId);
  const [events, bookings] = await Promise.all([listEvents(), selectStudentBookings(student.id)]);
  const bookedEvents = new Set(
    bookings.filter((b) => b.status !== "CANCELLED").map((b) => b.event_id),
  );
  const now = Date.now();
  const stageIndex = STAGE_ORDER.indexOf(student.stage as AdmissionStage);

  return events
    .filter((event) => event.is_open)
    .filter((event) => !event.programme_id || event.programme_id === student.programme_id)
    .filter((event) => {
      if (!event.target_stage) return true;
      return stageIndex >= STAGE_ORDER.indexOf(event.target_stage as AdmissionStage);
    })
    .filter((event) => {
      if (event.registration_opens_at && new Date(event.registration_opens_at).getTime() > now)
        return false;
      if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() < now)
        return false;
      return true;
    })
    .map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.event_type,
      description: event.description,
      alreadyBooked: bookedEvents.has(event.id),
      allowCancellation: event.allow_cancellation,
      sessions: event.sessions
        .filter((s) => s.is_open && new Date(s.starts_at).getTime() > now)
        .map((s) => ({
          id: s.id,
          startsAt: s.starts_at,
          endsAt: s.ends_at,
          venue: s.venues?.name ?? "Venue to be confirmed",
          capacity: s.capacity,
          booked: s.booked,
          seatsLeft: s.seatsLeft,
          waitlistEnabled: s.waitlist_enabled,
        })),
    }))
    .filter((event) => event.sessions.length > 0);
}

export async function registerForSession(userId: string, sessionId: string) {
  const student = await requireStudent(userId);
  return bookSession({
    sessionId,
    studentId: student.id,
    actorId: userId,
    actorLabel: `${student.full_name} (self-registration)`,
  });
}

export async function cancelMyBooking(userId: string, bookingId: string) {
  const student = await requireStudent(userId);
  const { cancelBooking } = await import("@/domains/events/events.service");
  return cancelBooking({ bookingId, studentId: student.id });
}
