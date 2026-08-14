import { createHash, timingSafeEqual } from "node:crypto";

import { parseStudentQrPayload } from "@/lib/qr";
import {
  insertAttendance,
  markBookingAttended,
  selectAttendance,
  selectDaySession,
  selectSessionBooking,
  selectSessionBookings,
  selectSessionsBetween,
  selectStudentBrief,
  updateGroundPassword,
  type DaySessionRow,
} from "./attendance.repo";
import {
  issueGroundAccess,
  requireGroundAccess,
  type GroundPurpose,
} from "./ground.access.server";
import type { GroundLoginInput } from "./schema";

function equals(a: string, b: string) {
  const x = createHash("sha256").update(a, "utf8").digest();
  const y = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(x, y);
}

function dayBounds(now = new Date()) {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

const isExam = (eventType?: string | null) => eventType === "EXAM";

/** Public: today's published sessions for one mode, never exposing the password. */
export async function listTodaySessions(purpose: GroundPurpose = "SEMINAR") {
  const { from, to } = dayBounds();
  const rows = await selectSessionsBetween(from, to);
  return rows
    .filter((s) => s.is_open && s.ground_password)
    .filter((s) => (purpose === "EXAM" ? isExam(s.events?.event_type) : !isExam(s.events?.event_type)))
    .map((s) => ({
      id: s.id,
      title: s.events?.title ?? "Session",
      eventType: s.events?.event_type ?? "OTHER",
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      venue: s.venues ? `${s.venues.name} · ${s.venues.campus}` : "Venue to be confirmed",
      capacity: s.capacity,
    }));
}

export async function groundLogin(input: GroundLoginInput) {
  const session = await selectDaySession(input.sessionId);
  if (!session || !session.is_open || !session.events?.is_open) {
    throw new Error("This session is not available");
  }
  if (isExam(session.events?.event_type) !== (input.purpose === "EXAM")) {
    throw new Error("This session belongs to a different day mode");
  }
  if (!session.ground_password) throw new Error("No ground password has been set for this session");
  if (!equals(input.password, session.ground_password)) throw new Error("Incorrect password");

  const token = await issueGroundAccess(session.id, input.staffName, input.purpose);
  return { ok: true as const, token };
}

function counts(session: DaySessionRow, registered: number, present: number, walkIns: number) {
  const occupied = registered + walkIns;
  return {
    capacity: session.capacity,
    reservedSeats: session.reserved_seats,
    registered,
    present,
    walkIns,
    seatsLeft: Math.max(session.capacity - occupied, 0),
  };
}

export async function getSessionBoard(sessionId: string) {
  const session = await selectDaySession(sessionId);
  if (!session) throw new Error("Session not found");
  const [bookings, attendance] = await Promise.all([
    selectSessionBookings(sessionId),
    selectAttendance(sessionId),
  ]);
  const walkIns = attendance.filter((a) => a.is_walk_in);

  return {
    session: {
      id: session.id,
      title: session.events?.title ?? "Session",
      eventType: session.events?.event_type ?? "OTHER",
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      venue: session.venues ? `${session.venues.name} · ${session.venues.campus}` : "Venue TBC",
    },
    stats: counts(session, bookings.length, attendance.length, walkIns.length),
    bookings,
    attendance,
  };
}

export async function groundBoard(token?: string | null) {
  const { sessionId, staffName, purpose } = await requireGroundAccess(token);
  const board = await getSessionBoard(sessionId);
  return { ...board, staffName, purpose };
}

export type ScanResult = {
  status: "REGISTERED" | "ALREADY_PRESENT" | "WALK_IN_AVAILABLE" | "SESSION_FULL" | "NOT_REGISTERED" | "UNKNOWN";
  message: string;
  student?: { id: string; fullName: string; studentCode: string; phone: string };
  bookingRef?: string | null;
};

export async function scanStudent(payload: string, token?: string | null): Promise<ScanResult> {
  const { sessionId, purpose } = await requireGroundAccess(token);
  const parsed = parseStudentQrPayload(payload);
  if (!parsed) return { status: "UNKNOWN", message: "This QR code is not an Admissions OS pass" };

  const student = await selectStudentBrief(parsed.studentId);
  if (!student) return { status: "UNKNOWN", message: "No student matches this QR code" };

  const brief = {
    id: student.id,
    fullName: student.full_name,
    studentCode: student.student_code,
    phone: student.phone,
  };

  const attendance = await selectAttendance(sessionId);
  if (attendance.some((a) => a.student_id === student.id)) {
    return { status: "ALREADY_PRESENT", message: "Attendance already recorded", student: brief };
  }

  const booking = await selectSessionBooking(sessionId, student.id);
  if (booking) {
    return {
      status: "REGISTERED",
      message:
        purpose === "EXAM"
          ? "Hall ticket valid — registered for this exam"
          : "Registered for this session",
      student: brief,
      bookingRef: booking.booking_ref,
    };
  }

  // Exams need a hall ticket, so walk-ins are never permitted.
  if (purpose === "EXAM") {
    return {
      status: "NOT_REGISTERED",
      message: "Not registered for this exam — a hall ticket is required",
      student: brief,
    };
  }

  const board = await getSessionBoard(sessionId);
  if (board.stats.seatsLeft <= 0) {
    return { status: "SESSION_FULL", message: "Not registered — no walk-in seats left", student: brief };
  }
  return {
    status: "WALK_IN_AVAILABLE",
    message: `Not registered — ${board.stats.seatsLeft} walk-in seat(s) free`,
    student: brief,
  };
}

export async function markAttendance(studentId: string, token?: string | null) {
  const { sessionId, staffName, purpose } = await requireGroundAccess(token);
  const session = await selectDaySession(sessionId);
  if (!session) throw new Error("Session not found");

  const existing = await selectAttendance(sessionId);
  if (existing.some((a) => a.student_id === studentId)) {
    throw new Error("Attendance already recorded for this student");
  }

  const student = await selectStudentBrief(studentId);
  if (!student) throw new Error("Student not found");

  const booking = await selectSessionBooking(sessionId, studentId);
  if (!booking) {
    if (purpose === "EXAM") throw new Error("This candidate has no exam registration");
    const board = await getSessionBoard(sessionId);
    if (board.stats.seatsLeft <= 0) throw new Error("No walk-in seats left");
  }

  await insertAttendance({
    student_id: studentId,
    booking_id: booking?.id ?? null,
    session_id: sessionId,
    seminar_id: null,
    programme_id: student.programme_id,
    is_walk_in: !booking,
    staff_name: staffName,
    scanned_by: null,
  });
  if (booking) await markBookingAttended(booking.id);

  return { ok: true as const, walkIn: !booking };
}

function randomPassword() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function setGroundPassword(sessionId: string, password?: string) {
  const value = password?.trim() || randomPassword();
  await updateGroundPassword(sessionId, value);
  return { password: value };
}
