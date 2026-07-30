import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { STAGE_ORDER } from "@/domains/admissions/types";
import type { AdmissionStage } from "@/domains/admissions/types";

/** Module 11 — pipeline analytics used by the dashboard and reports screens. */
export async function pipelineOverview() {
  const { data, error } = await supabaseAdmin.from("students").select("stage, lead_source, created_at");
  if (error) throw new Error(error.message);

  const byStage = new Map<AdmissionStage, number>(STAGE_ORDER.map((s) => [s, 0]));
  const bySource = new Map<string, number>();
  let last30 = 0;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const row of data ?? []) {
    const stage = row.stage as AdmissionStage;
    byStage.set(stage, (byStage.get(stage) ?? 0) + 1);
    bySource.set(row.lead_source, (bySource.get(row.lead_source) ?? 0) + 1);
    if (new Date(row.created_at).getTime() >= cutoff) last30 += 1;
  }

  const total = data?.length ?? 0;
  const hallTickets = byStage.get("HALL_TICKET_GENERATED") ?? 0;

  return {
    total,
    last30,
    hallTickets,
    conversionRate: total === 0 ? 0 : Math.round((hallTickets / total) * 1000) / 10,
    stages: STAGE_ORDER.map((stage) => ({ stage, count: byStage.get(stage) ?? 0 })),
    sources: [...bySource.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function recentActivity(limit = 8) {
  const { data, error } = await supabaseAdmin
    .from("student_events")
    .select("id, to_stage, from_stage, actor_label, created_at, students(full_name, student_code)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const student = row.students as unknown as { full_name: string; student_code: string } | null;
    return {
      id: row.id,
      toStage: row.to_stage as AdmissionStage,
      fromStage: row.from_stage as AdmissionStage | null,
      actorLabel: row.actor_label,
      createdAt: row.created_at,
      studentName: student?.full_name ?? "Unknown student",
      studentCode: student?.student_code ?? "",
    };
  });
}
