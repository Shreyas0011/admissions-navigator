import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { StageBadge } from "@/components/shared/StageBadge";
import type { AdmissionStage } from "@/domains/admissions/types";
import { getProgrammeFn } from "@/domains/programmes/programmes.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/_authenticated/programmes/$programmeId")({
  head: () => ({
    meta: [
      { title: "Programme Detail — Admissions OS" },
      { name: "description", content: "Applicant pipeline and configuration for a single programme." },
    ],
  }),
  component: ProgrammeDetailPage,
});

function ProgrammeDetailPage() {
  const { programmeId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["programme", programmeId],
    queryFn: () => getProgrammeFn({ data: { id: programmeId } }),
  });

  if (isLoading || !data) return <Skeleton className="h-72 rounded-2xl" />;
  const { programme, stageBreakdown } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={programme.code}
        title={programme.name}
        description={`${programme.department} · ${programme.academic_years?.label ?? "No academic year"} · status ${programme.status}`}
        actions={
          <>
            <StatCard label="Intake" value={programme.intake} />
            <StatCard label="Applications" value={programme.applications} accent />
            <StatCard label="Fill rate" value={`${programme.fillRate}%`} />
          </>
        }
      />

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Applicant pipeline</h2>
        {stageBreakdown.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-3">
            {stageBreakdown.map((s) => (
              <li
                key={s.stage}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
              >
                <StageBadge stage={s.stage as AdmissionStage} />
                <span className="text-lg font-semibold tabular-nums text-foreground">{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Application window</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="label-caps text-muted-foreground">Opens</dt>
            <dd className="mt-1 text-foreground">
              {programme.applications_open_at
                ? formatDateTime(programme.applications_open_at)
                : "Always open"}
            </dd>
          </div>
          <div>
            <dt className="label-caps text-muted-foreground">Closes</dt>
            <dd className="mt-1 text-foreground">
              {programme.applications_close_at
                ? formatDateTime(programme.applications_close_at)
                : "No close date"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
