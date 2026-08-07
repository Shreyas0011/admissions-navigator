/**
 * Static student QR payload.
 *
 * Rule fixed at project start: the payload is deterministic and derived ONLY
 * from the student's UUID and full name. No timestamps, salts, URLs, tokens or
 * any other changing value — the same student always produces the same QR.
 */
export const QR_PREFIX = "ADMOS1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildStudentQrPayload(studentId: string, fullName: string): string {
  return `${QR_PREFIX}|${studentId}|${fullName.trim().replace(/\s+/g, " ")}`;
}

export type ParsedStudentQr = { studentId: string; fullName: string };

export function parseStudentQrPayload(raw: string): ParsedStudentQr | null {
  const value = raw.trim();
  if (UUID_RE.test(value)) return { studentId: value.toLowerCase(), fullName: "" };

  const parts = value.split("|");
  if (parts.length < 3 || parts[0] !== QR_PREFIX) return null;
  const studentId = (parts[1] ?? "").trim();
  if (!UUID_RE.test(studentId)) return null;
  return { studentId: studentId.toLowerCase(), fullName: parts.slice(2).join("|").trim() };
}
