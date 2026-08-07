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
import { requireGroundSession, startGroundSession } from "./ground.session.server";
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

/** Public: today's published sessions, without ever exposing the password. */
export async function listTodaySessions() {
  const { from, to } = dayBounds();
  const rows = await selectSessionsBetween(from, to);
  return rows
    .filter((s) => s.is_open && s.ground_password)
    .map((s) => ({
      id: s.id,
      title: s.events?.title ?? "Seminar",
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
    throw new Error("This seminar is not available");
  }
  if (!session.ground_password) throw new Error("No ground password has been set for this seminar");
  if (!equals(input.password, session.ground_password)) throw new Error("Incorrect password");

  await startGroundSession(session.id, input.staffName);
  return { ok: true as const };
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
  if (!session) throw new Error("Seminar session not found");
  const [bookings, attendance] = await Promise.all([
    selectSessionBookings(sessionId),
    selectAttendance(sessionId),
  ]);
  const walkIns = attendance.filter((a) => a.is_walk_in);

  return {
    session: {
      id: session.id,
      title: session.events?.title ?? "Seminar",
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

export async function groundBoard() {
  const { sessionId, staffName } = await requireGroundSession();
  const board = await getSessionBoard(sessionId);
  return { ...board, staffName };
}

export type ScanResult = {
  status: "REGISTERED" | "ALREADY_PRESENT" | "WALK_IN_AVAILABLE" | "SESSION_FULL" | "UNKNOWN";
  message: string;
  student?: { id: string; fullName: string; studentCode: string; phone: string };
  bookingRef?: string | null;
};

export async function scanStudent(payload: string): Promise<ScanResult> {
  const { sessionId } = await requireGroundSession();
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
      message: "Registered for this session",
      student: brief,
      bookingRef: booking.booking_ref,
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

export async function markAttendance(studentId: string) {
  const { sessionId, staffName } = await requireGroundSession();
  const session = await selectDaySession(sessionId);
  if (!session) throw new Error("Seminar session not found");

  const existing = await selectAttendance(sessionId);
  if (existing.some((a) => a.student_id === studentId)) {
    throw new Error("Attendance already recorded for this student");
  }

  const student = await selectStudentBrief(studentId);
  if (!student) throw new Error("Student not found");

  const booking = await selectSessionBooking(sessionId, studentId);
  if (!booking) {
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
  return Array.from(
    { length: 8 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export async function setGroundPassword(sessionId: string, password?: string) {
  const value = password?.trim() || randomPassword();
  await updateGroundPassword(sessionId, value);
  return { password: value };
}
