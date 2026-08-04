import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ProgressTimeline, type ProgressStep } from "@/components/portal/ProgressTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyApplicationFn } from "@/domains/portal/portal.functions";

export const Route = createFileRoute("/portal/progress")({
  head: () => ({
    meta: [
      { title: "Admission Progress — Admissions OS" },
      { name: "description", content: "Phase-wise progress of your admission application." },
      { property: "og:title", content: "Admission Progress — Admissions OS" },
      { property: "og:description", content: "Phase-wise progress of your application." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal", "application"],
    queryFn: () => getMyApplicationFn(),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Timeline</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Admission progress
        </h1>
      </header>

      <section className="surface-card rounded-2xl p-6">
        {isLoading || !data ? (
          <Skeleton className="h-72" />
        ) : (
          <ProgressTimeline steps={data.progress as ProgressStep[]} />
        )}
      </section>
    </div>
  );
}
