import { useSession } from "@tanstack/react-start/server";

export type GroundSessionData = {
  sessionId?: string;
  staffName?: string;
};

function config() {
  const password = process.env["GROUND_SESSION_SECRET"];
  if (!password) throw new Error("GROUND_SESSION_SECRET is not configured");
  return {
    password,
    name: "ground-staff",
    maxAge: 60 * 60 * 12,
    // The app is served inside a cross-site preview iframe, where a Lax
    // cookie is never sent back — the console would always read "expired".
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

export async function readGroundSession() {
  const session = await useSession<GroundSessionData>(config());
  return session.data;
}

export async function startGroundSession(sessionId: string, staffName: string) {
  const session = await useSession<GroundSessionData>(config());
  await session.update({ sessionId, staffName });
}

export async function endGroundSession() {
  const session = await useSession<GroundSessionData>(config());
  await session.clear();
}

/** Every ground-staff read/write goes through this gate. */
export async function requireGroundSession() {
  const data = await readGroundSession();
  if (!data.sessionId || !data.staffName) throw new Error("Seminar session expired — sign in again");
  return { sessionId: data.sessionId, staffName: data.staffName };
}
