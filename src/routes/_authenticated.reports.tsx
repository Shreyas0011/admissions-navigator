import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_MAP } from "@/config/constants";
import { getPipelineOverview } from "@/domains/analytics/analytics.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Admissions OS" },
      { name: "description", content: "Conversion, stage distribution and lead source performance." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pipeline-overview"],
    queryFn: () => getPipelineOverview(),
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { overview } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Phase 1 reporting: funnel distribution and lead source performance."
        actions={
          <>
            <StatCard label="Students" value={overview.total} />
            <StatCard label="Conversion" value={`${overview.conversionRate}%`} accent />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Stage distribution</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {overview.stages.map((row) => (
                <tr key={row.stage} className="border-b border-border/70 last:border-0">
                  <td className="py-2.5 text-muted-foreground">{STAGE_MAP[row.stage].label}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {row.count}
                  </td>
                  <td className="w-16 py-2.5 text-right text-xs text-muted-foreground">
                    {overview.total ? Math.round((row.count / overview.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="surface-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Lead sources</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {overview.sources.map((row) => (
                <tr key={row.source} className="border-b border-border/70 last:border-0">
                  <td className="py-2.5 text-muted-foreground capitalize">
                    {row.source.replace("_", " ").toLowerCase()}
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
