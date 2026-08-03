import { selectCounsellor, type AssignmentAlgorithm, type Candidate } from "./algorithms";
import {
  insertAssignmentAudit,
  selectActivePolicy,
  selectCandidatePool,
  selectPools,
  selectRules,
} from "./assignment.repo";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AssignmentDecision = {
  assigned: boolean;
  counsellorId: string | null;
  counsellorName: string | null;
  algorithm: AssignmentAlgorithm | null;
  ruleLabel: string;
  reason?: string;
};

type ResolveArgs = {
  studentId: string;
  actorId?: string | null;
  actorLabel?: string;
  /** Manual runs ignore the auto-assign toggle. */
  force?: boolean;
};

/**
 * The single entry point of the Assignment Engine: match a rule, resolve the
 * pool, run the algorithm, write the student and an audit row.
 */
export async function resolveAssignment(args: ResolveArgs): Promise<AssignmentDecision> {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, stage, programme_id, counsellor_id")
    .eq("id", args.studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!student) throw new Error("Student not found");

  const policy = await selectActivePolicy();
  if (!policy) return miss("No assignment policy is enabled");
  if (!policy.auto_assign && !args.force) return miss("Auto-assign is switched off");

  const [rules, pools, candidates] = await Promise.all([
    selectRules(policy.id),
    selectPools(),
    selectCandidatePool(),
  ]);

  const rule =
    rules.find((r) => r.programme_id && r.programme_id === student.programme_id) ??
    rules.find((r) => r.programme_id === null) ??
    null;

  const poolId = rule?.pool_id ?? policy.default_pool_id;
  const pool = pools.find((p) => p.id === poolId) ?? null;
  const algorithm: AssignmentAlgorithm =
    rule?.algorithm ??
    ((pool?.default_algorithm as AssignmentAlgorithm | undefined) ??
      (policy.fallback_algorithm as AssignmentAlgorithm));

  const memberIds = new Set((pool?.counsellor_pool_members ?? []).map((m) => m.counsellor_id));
  const eligible: Candidate[] =
    memberIds.size > 0 ? candidates.filter((c) => memberIds.has(c.id)) : candidates;

  const ruleLabel = rule
    ? `${rule.programmes?.name ?? "Any programme"} → ${rule.counsellor_pools?.name ?? "Pool"}`
    : `Default pool → ${pool?.name ?? "All counsellors"}`;

  const picked = selectCounsellor(algorithm, eligible);

  await insertAssignmentAudit({
    student_id: student.id,
    counsellor_id: picked?.id ?? null,
    programme_id: student.programme_id,
    policy_id: policy.id,
    rule_id: rule?.id ?? null,
    pool_id: pool?.id ?? null,
    algorithm,
    source: args.force && args.actorId ? "MANUAL" : "AUTO",
    rule_label: ruleLabel,
    candidates: eligible.map((c) => ({ id: c.id, name: c.name, activeLeads: c.activeLeads })),
    actor_id: args.actorId ?? null,
    actor_label: args.actorLabel ?? "Assignment Engine",
  });

  if (!picked) {
    return {
      assigned: false,
      counsellorId: null,
      counsellorName: null,
      algorithm,
      ruleLabel,
      reason:
        algorithm === "MANUAL" ? "Policy is manual only" : "No eligible counsellor in the pool",
    };
  }

  const { assignCounsellor } = await import("@/domains/students/students.server");
  await assignCounsellor({
    studentId: student.id,
    counsellorId: picked.id,
    actorId: args.actorId ?? null,
    actorLabel: args.actorLabel ?? "Assignment Engine",
  });

  return {
    assigned: true,
    counsellorId: picked.id,
    counsellorName: picked.name,
    algorithm,
    ruleLabel,
  };
}

function miss(reason: string): AssignmentDecision {
  return {
    assigned: false,
    counsellorId: null,
    counsellorName: null,
    algorithm: null,
    ruleLabel: "—",
    reason,
  };
}

/** Runs the engine across every unassigned student. */
export async function runEngineOnQueue(args: { actorId: string; actorLabel: string }) {
  const { selectUnassignedStudents } = await import("./assignment.repo");
  const queue = await selectUnassignedStudents(200);
  let assigned = 0;
  for (const student of queue) {
    const decision = await resolveAssignment({
      studentId: student.id,
      actorId: args.actorId,
      actorLabel: args.actorLabel,
      force: true,
    });
    if (decision.assigned) assigned += 1;
  }
  return { considered: queue.length, assigned };
}
