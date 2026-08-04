import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { bookSession, getEventDetail, type SessionSummary } from "./events.service";

type Strategy = "FIRST_AVAILABLE" | "LEAST_FILLED" | "ROUND_ROBIN" | "MANUAL";

/** Picks the session a student should be placed into, per the event strategy. */
export function pickSession(
  strategy: Strategy,
  sessions: SessionSummary[],
  cursor: number,
): SessionSummary | null {
  const open = sessions.filter((s) => s.is_open && s.seatsLeft > 0);
  if (open.length === 0) return null;
  switch (strategy) {
    case "LEAST_FILLED":
      return [...open].sort((a, b) => b.seatsLeft - a.seatsLeft)[0] ?? null;
    case "ROUND_ROBIN":
      return open[cursor % open.length] ?? null;
    case "FIRST_AVAILABLE":
      return open[0] ?? null;
    default:
      return null;
  }
}

async function eligibleStudents(programmeId: string | null, targetStage: string | null) {
  let query = supabaseAdmin.from("students").select("id, stage, programme_id");
  if (programmeId) query = query.eq("programme_id", programmeId);
  if (targetStage) query = query.eq("stage", targetStage);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Distributes every eligible student of the event's programme across its open
 * sessions using the configured strategy. Already-booked students are skipped,
 * so self-registration and auto-allocation never oversell a session.
 */
export async function autoAllocate(args: {
  eventId: string;
  actorId: string | null;
  actorLabel: string;
}) {
  const detail = await getEventDetail(args.eventId);
  const event = detail.event;
  if (event.allocation_strategy === "MANUAL") {
    return { considered: 0, allocated: 0, skipped: 0, message: "Strategy is manual only" };
  }

  const alreadyBooked = new Set(
    detail.bookings.filter((b) => b.status !== "CANCELLED").map((b) => b.student_id),
  );
  const students = await eligibleStudents(event.programme_id, event.target_stage);
  const queue = students.filter((s) => !alreadyBooked.has(s.id));

  const seatState = event.sessions.map((s) => ({ ...s }));
  let allocated = 0;
  let skipped = 0;

  for (const [index, student] of queue.entries()) {
    const session = pickSession(event.allocation_strategy, seatState, index);
    if (!session) {
      skipped += 1;
      continue;
    }
    try {
      await bookSession({
        sessionId: session.id,
        studentId: student.id,
        actorId: args.actorId,
        actorLabel: args.actorLabel,
      });
      allocated += 1;
      const live = seatState.find((s) => s.id === session.id);
      if (live) {
        live.booked += 1;
        live.seatsLeft = Math.max(live.seatsLeft - 1, 0);
      }
    } catch {
      skipped += 1;
    }
  }

  return {
    considered: queue.length,
    allocated,
    skipped,
    message: `${allocated} of ${queue.length} eligible students allocated`,
  };
}
