import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { listCounsellors } from "@/domains/counsellors/counsellors.functions";

export const Route = createFileRoute("/_authenticated/lead-assignment")({
  head: () => ({
    meta: [
      { title: "Lead Assignment — Admissions OS" },
      { name: "description", content: "Counsellor workload and lead distribution across the team." },
    ],
  }),
  component: LeadAssignmentPage,
});

function LeadAssignmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["counsellors"],
    queryFn: () => listCounsellors(),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team"
        title="Lead Assignment"
        description="Current active load per counsellor. Assign leads from a student's profile in the registry."
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((c) => {
            const load = Math.round((c.active_leads / Math.max(c.max_active_leads, 1)) * 100);
            return (
              <article key={c.id} className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground">{c.full_name}</h2>
                <p className="text-sm text-muted-foreground">{c.email}</p>
                <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">
                  {c.active_leads}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / {c.max_active_leads} active leads
                  </span>
                </p>
                <Progress value={Math.min(load, 100)} className="mt-4 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.is_active ? `${load}% of capacity` : "Inactive"}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
