import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ground-staff auth is a signed token, not a cookie: several staff phones sign
 * in to the same seminar at once, and browsers on other devices (or inside a
 * cross-site preview iframe) may drop the cookie entirely.
 */
export type GroundClaims = { sessionId: string; staffName: string; exp: number };

const TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  const value = process.env["GROUND_SESSION_SECRET"];
  if (!value) throw new Error("GROUND_SESSION_SECRET is not configured");
  return value;
}

function b64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueGroundToken(sessionId: string, staffName: string): string {
  const claims: GroundClaims = { sessionId, staffName, exp: Date.now() + TTL_MS };
  const payload = b64url(JSON.stringify(claims));
  return `${payload}.${sign(payload)}`;
}

export function requireGroundToken(token?: string | null): GroundClaims {
  const expired = new Error("Seminar session expired — sign in again");
  if (!token) throw expired;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw expired;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw expired;

  let claims: GroundClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw expired;
  }
  if (!claims.sessionId || !claims.staffName || claims.exp < Date.now()) throw expired;
  return claims;
}
