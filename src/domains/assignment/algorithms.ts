export type AssignmentAlgorithm = "ROUND_ROBIN" | "LEAST_WORKLOAD" | "LEAST_ACTIVE" | "MANUAL";

export type Candidate = {
  id: string;
  name: string;
  activeLeads: number;
  pendingActions: number;
  maxActiveLeads: number;
  /** ISO timestamp of the last assignment; null means never assigned. */
  lastAssignedAt: string | null;
};

const oldestFirst = (a: Candidate, b: Candidate) =>
  (a.lastAssignedAt ?? "").localeCompare(b.lastAssignedAt ?? "");

/**
 * Stateless round robin: the counsellor who waited longest since their last
 * assignment is next. Equivalent to a rotating pointer, without storing one.
 */
const STRATEGIES: Record<AssignmentAlgorithm, (c: Candidate[]) => Candidate | null> = {
  MANUAL: () => null,
  ROUND_ROBIN: (c) => [...c].sort(oldestFirst)[0] ?? null,
  LEAST_WORKLOAD: (c) =>
    [...c].sort((a, b) => a.activeLeads - b.activeLeads || oldestFirst(a, b))[0] ?? null,
  LEAST_ACTIVE: (c) =>
    [...c].sort((a, b) => a.pendingActions - b.pendingActions || oldestFirst(a, b))[0] ?? null,
};

/**
 * Picks the counsellor for one student. Counsellors at capacity are skipped
 * unless every candidate is full, in which case the algorithm still decides.
 */
export function selectCounsellor(
  algorithm: AssignmentAlgorithm,
  candidates: Candidate[],
): Candidate | null {
  if (candidates.length === 0) return null;
  const withRoom = candidates.filter((c) => c.activeLeads < c.maxActiveLeads);
  return STRATEGIES[algorithm](withRoom.length > 0 ? withRoom : candidates);
}

export const ALGORITHM_LABELS: Record<AssignmentAlgorithm, string> = {
  ROUND_ROBIN: "Round Robin",
  LEAST_WORKLOAD: "Least Workload",
  LEAST_ACTIVE: "Least Active Students",
  MANUAL: "Manual Only",
};
