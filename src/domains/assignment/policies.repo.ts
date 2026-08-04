import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function selectPolicies() {
  const { data, error } = await supabaseAdmin
    .from("assignment_policies")
    .select(
      "id, name, policy_type, enabled, auto_assign, fallback_algorithm, default_pool_id, priority, counsellor_pools(name)",
    )
    .order("priority");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    name: string;
    policy_type: string;
    enabled: boolean;
    auto_assign: boolean;
    fallback_algorithm: string;
    default_pool_id: string | null;
    priority: number;
    counsellor_pools: { name: string } | null;
  }[];
}

export async function insertPolicy(input: {
  name: string;
  policyType: string;
  autoAssign: boolean;
  fallbackAlgorithm: string;
  defaultPoolId: string | null;
  priority: number;
}) {
  const { data, error } = await supabaseAdmin
    .from("assignment_policies")
    .insert({
      name: input.name,
      policy_type: input.policyType as never,
      auto_assign: input.autoAssign,
      fallback_algorithm: input.fallbackAlgorithm as never,
      default_pool_id: input.defaultPoolId,
      priority: input.priority,
      enabled: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function setPolicyEnabled(id: string, enabled: boolean) {
  const { error } = await supabaseAdmin
    .from("assignment_policies")
    .update({ enabled })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function selectAllRules() {
  const { data, error } = await supabaseAdmin
    .from("assignment_rules")
    .select(
      "id, policy_id, programme_id, pool_id, algorithm, priority, programmes(name), counsellor_pools(name)",
    )
    .order("priority");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    policy_id: string;
    programme_id: string | null;
    pool_id: string;
    algorithm: string;
    priority: number;
    programmes: { name: string } | null;
    counsellor_pools: { name: string } | null;
  }[];
}

export async function selectStudentAssignments(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select("id, algorithm, source, rule_label, actor_label, candidates, created_at, counsellors(full_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    id: string;
    algorithm: string | null;
    source: string;
    rule_label: string | null;
    actor_label: string;
    candidates: { id: string; name: string; activeLeads: number }[];
    created_at: string;
    counsellors: { full_name: string } | null;
  }[];
}
