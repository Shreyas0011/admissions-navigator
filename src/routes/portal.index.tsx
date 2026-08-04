import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { StageBadge } from "@/components/shared/StageBadge";
import type { AdmissionStage } from "@/domains/admissions/types";
import { getMyApplicationFn } from "@/domains/portal/portal.functions";

export const Route = createFileRoute("/portal/")({
  head: () => ({
    meta: [
      { title: "My Application — Admissions OS" },
      { name: "description", content: "Track your admission application, counsellor and bookings." },
      { property: "og:title", content: "My Application — Admissions OS" },
      { property: "og:description", content: "Track your admission application status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "application"],
    queryFn: () => getMyApplicationFn(),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  const { student, bookings } = data;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Application</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Hello, {student.full_name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference <span className="font-mono text-foreground">{student.student_code}</span>
        </p>
      </header>

      <section className="surface-card grid gap-6 rounded-2xl p-6 sm:grid-cols-3">
        <Item label="Programme applied to" value={student.programmes?.name ?? "Not selected"} />
        <Item label="Department" value={student.programmes?.department ?? "—"} />
        <div>
          <p className="label-caps text-muted-foreground">Current stage</p>
          <div className="mt-2">
            <StageBadge stage={student.stage as AdmissionStage} />
          </div>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">My bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No seminar bookings yet — check the Seminars tab.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-xl border border-border p-4 text-sm">
                <p className="font-medium text-foreground">
                  {b.events?.title ?? "Session"}{" "}
                  <span className="font-mono text-xs text-primary">{b.booking_ref}</span>
                </p>
                <p className="text-muted-foreground">
                  {b.event_sessions
                    ? `${new Date(b.event_sessions.starts_at).toLocaleString()} · ${b.event_sessions.venues?.name ?? "Venue TBC"}`
                    : "Schedule to be confirmed"}{" "}
                  · {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-medium text-foreground">{value}</p>
    </div>
  );
}
