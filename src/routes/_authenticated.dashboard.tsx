import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingUp, Users, Ticket, CalendarClock } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StageBadge } from "@/components/shared/StageBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_MAP } from "@/config/constants";
import { getPipelineOverview } from "@/domains/analytics/analytics.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Admissions Dashboard — Admissions OS" },
      {
        name: "description",
        content: "Live pipeline health, stage funnel and recent counsellor activity.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pipeline-overview"],
    queryFn: () => getPipelineOverview(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const { overview, activity } = data;
  const peak = Math.max(...overview.stages.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Admissions Dashboard"
        description="How the current intake is moving from first enquiry to hall ticket."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={overview.total} hint="All time" />
        <StatCard label="New in 30 days" value={overview.last30} hint="Fresh enquiries" />
        <StatCard label="Hall tickets" value={overview.hallTickets} hint="Exam ready" />
        <StatCard
          label="Conversion"
          value={`${overview.conversionRate}%`}
          hint="Enquiry → hall ticket"
          accent
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="size-4 text-primary" />
            Stage funnel
          </h2>
          <ul className="mt-6 space-y-4">
            {overview.stages.map((row) => (
              <li key={row.stage} className="grid grid-cols-[170px_1fr_auto] items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {STAGE_MAP[row.stage].label}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max((row.count / peak) * 100, 2)}%` }}
                  />
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="size-4 text-primary" />
            Lead sources
          </h2>
          <ul className="mt-6 space-y-3">
            {overview.sources.map((row) => (
              <li key={row.source} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">
                  {row.source.replace("_", " ").toLowerCase()}
                </span>
                <span className="font-semibold tabular-nums text-foreground">{row.count}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-2 border-t border-border pt-6">
            <QuickLink to="/students" icon={<Users className="size-4" />} label="Students Registry" />
            <QuickLink
              to="/seminars"
              icon={<CalendarClock className="size-4" />}
              label="Seminars & attendance"
            />
            <QuickLink to="/exams" icon={<Ticket className="size-4" />} label="Exams & hall tickets" />
          </div>
        </section>
      </div>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
        <ul className="mt-5 divide-y divide-border">
          {activity.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center gap-3 py-3">
              <StageBadge stage={event.toStage} short />
              <span className="text-sm font-medium text-foreground">{event.studentName}</span>
              <span className="font-mono text-xs text-muted-foreground">{event.studentCode}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {event.actorLabel} · {new Date(event.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: "/students" | "/seminars" | "/exams";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-low"
    >
      <span className="text-primary">{icon}</span>
      {label}
      <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
    </Link>
  );
}
