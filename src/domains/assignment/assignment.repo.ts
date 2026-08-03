import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import type { AssignmentAlgorithm, Candidate } from "./algorithms";

export type AssignmentAuditRow = Database["public"]["Tables"]["assignments"]["Insert"];
import type { PolicyInput, PoolInput, RuleInput } from "./schema";

export async function selectActivePolicy() {
  const { data, error } = await supabaseAdmin
    .from("assignment_policies")
    .select("id, name, policy_type, enabled, auto_assign, fallback_algorithm, default_pool_id, priority")
    .eq("enabled", true)
    .order("priority")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectRules(policyId: string) {
  const { data, error } = await supabaseAdmin
    .from("assignment_rules")
    .select("id, policy_id, programme_id, pool_id, algorithm, priority, programmes(name), counsellor_pools(name)")
    .eq("policy_id", policyId)
    .order("priority");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    policy_id: string;
    programme_id: string | null;
    pool_id: string;
    algorithm: AssignmentAlgorithm;
    priority: number;
    programmes: { name: string } | null;
    counsellor_pools: { name: string } | null;
  }[];
}

export async function selectPools() {
  const { data, error } = await supabaseAdmin
    .from("counsellor_pools")
    .select("id, name, description, default_algorithm, is_active, counsellor_pool_members(counsellor_id)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    name: string;
    description: string | null;
    default_algorithm: string;
    is_active: boolean;
    counsellor_pool_members: { counsellor_id: string }[];
  }[];
}

/** Live workload per counsellor, the raw input to every algorithm. */
export async function selectCandidatePool(): Promise<Candidate[]> {
  const [{ data: counsellors, error }, { data: students }, { data: assignments }] =
    await Promise.all([
      supabaseAdmin
        .from("counsellors")
        .select("id, full_name, max_active_leads")
        .eq("is_active", true),
      supabaseAdmin
        .from("students")
        .select("counsellor_id, stage")
        .not("counsellor_id", "is", null)
        .neq("stage", "HALL_TICKET_GENERATED"),
      supabaseAdmin
        .from("assignments")
        .select("counsellor_id, created_at")
        .order("created_at", { ascending: false }),
    ]);
  if (error) throw new Error(error.message);

  const active = new Map<string, number>();
  const pending = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.counsellor_id) continue;
    active.set(s.counsellor_id, (active.get(s.counsellor_id) ?? 0) + 1);
    if (s.stage === "ASSIGNED") pending.set(s.counsellor_id, (pending.get(s.counsellor_id) ?? 0) + 1);
  }

  const lastAssigned = new Map<string, string>();
  for (const a of assignments ?? []) {
    if (a.counsellor_id && !lastAssigned.has(a.counsellor_id)) {
      lastAssigned.set(a.counsellor_id, a.created_at);
    }
  }

  return (counsellors ?? []).map((c) => ({
    id: c.id,
    name: c.full_name,
    activeLeads: active.get(c.id) ?? 0,
    pendingActions: pending.get(c.id) ?? 0,
    maxActiveLeads: c.max_active_leads,
    lastAssignedAt: lastAssigned.get(c.id) ?? null,
  }));
}

export async function selectUnassignedStudents(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, student_code, full_name, email, phone, stage, created_at, programme_id, programmes(name)")
    .is("counsellor_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    stage: string;
    created_at: string;
    programme_id: string | null;
    programmes: { name: string } | null;
  }[];
}

export async function selectAssignmentLog(limit = 40) {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select("id, algorithm, source, rule_label, actor_label, candidates, created_at, students(full_name, student_code), counsellors(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    algorithm: string | null;
    source: string;
    rule_label: string | null;
    actor_label: string;
    candidates: unknown;
    created_at: string;
    students: { full_name: string; student_code: string } | null;
    counsellors: { full_name: string } | null;
  }[];
}

export async function insertAssignmentAudit(row: AssignmentAuditRow) {
  const { error } = await supabaseAdmin.from("assignments").insert(row);
  if (error) throw new Error(error.message);
}

export async function updatePolicy(input: PolicyInput) {
  const { error } = await supabaseAdmin
    .from("assignment_policies")
    .update({
      policy_type: input.policyType,
      auto_assign: input.autoAssign,
      fallback_algorithm: input.fallbackAlgorithm,
      default_pool_id: input.defaultPoolId,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function savePoolRow(input: PoolInput) {
  const row = {
    name: input.name,
    description: input.description ?? null,
    default_algorithm: input.defaultAlgorithm,
  };
  const { data, error } = input.id
    ? await supabaseAdmin.from("counsellor_pools").update(row).eq("id", input.id).select("id").single()
    : await supabaseAdmin.from("counsellor_pools").insert(row).select("id").single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("counsellor_pool_members").delete().eq("pool_id", data.id);
  if (input.memberIds.length > 0) {
    const { error: memberError } = await supabaseAdmin
      .from("counsellor_pool_members")
      .insert(input.memberIds.map((counsellor_id) => ({ pool_id: data.id, counsellor_id })));
    if (memberError) throw new Error(memberError.message);
  }
  return { id: data.id };
}

export async function saveRuleRow(input: RuleInput) {
  const row = {
    policy_id: input.policyId,
    programme_id: input.programmeId,
    pool_id: input.poolId,
    algorithm: input.algorithm,
    priority: input.priority,
  };
  const { error } = input.id
    ? await supabaseAdmin.from("assignment_rules").update(row).eq("id", input.id)
    : await supabaseAdmin.from("assignment_rules").insert(row);
  if (error) throw new Error(error.message);
}

export async function deleteRuleRow(id: string) {
  const { error } = await supabaseAdmin.from("assignment_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
