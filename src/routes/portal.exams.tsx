import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileText, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { getMyApplicationFn, listMySessionsFn } from "@/domains/portal/portal.functions";
import { registerForExamFn } from "@/domains/exams/exams.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/portal/exams")({
  head: () => ({
    meta: [
      { title: "Exam Registration & Hall Ticket — Admissions OS" },
      {
        name: "description",
        content: "Register for your entrance exam and download your hall ticket.",
      },
      { property: "og:title", content: "Exam Registration & Hall Ticket — Admissions OS" },
      { property: "og:description", content: "Entrance exam registration for applicants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const queryClient = useQueryClient();

  const sessions = useQuery({ queryKey: ["portal", "sessions"], queryFn: () => listMySessionsFn() });
  const application = useQuery({
    queryKey: ["portal", "application"],
    queryFn: () => getMyApplicationFn(),
  });

  const exams = (sessions.data ?? []).filter((e) => e.eventType === "EXAM");
  const tickets = (application.data?.bookings ?? []).filter(
    (b) => b.events?.event_type === "EXAM" && b.status !== "CANCELLED",
  );

  const register = useMutation({
    mutationFn: (sessionId: string) => registerForExamFn({ data: { sessionId } }),
    onSuccess: () => {
      toast.success("Registered — your hall ticket is ready");
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Entrance exam</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Exams</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register for an exam slot, then download the hall ticket you must carry with your Aadhaar
          card.
        </p>
      </header>

      {tickets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">My hall tickets</h2>
          {tickets.map((b) => (
            <div
              key={b.id}
              className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
            >
              <div className="text-sm">
                <p className="font-medium text-foreground">{b.events?.title}</p>
                <p className="text-muted-foreground">
                  {b.event_sessions ? formatDateTime(b.event_sessions.starts_at) : "Date TBC"}
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/portal/hall-ticket/$bookingId" params={{ bookingId: b.id }}>
                  <FileText className="mr-1 size-4" /> Hall ticket
                </Link>
              </Button>
            </div>
          ))}
        </section>
      )}

      {sessions.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : exams.length === 0 ? (
        <EmptyState
          title="No exams open for you yet"
          description="Exam slots appear here once an entrance exam is published for your programme and stage."
        />
      ) : (
        <div className="space-y-4">
          {exams.map((event) => (
            <article key={event.id} className="surface-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label-caps text-primary">Exam</span>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{event.title}</h2>
                </div>
                {event.alreadyBooked && (
                  <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                    Registered
                  </span>
                )}
              </div>

              <ul className="mt-5 space-y-3">
                {event.sessions.map((s) => {
                  const full = s.seatsLeft <= 0;
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
                    >
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2 font-medium text-foreground">
                          <CalendarClock className="size-4" />
                          {formatDateTime(s.startsAt)}
                        </p>
                        <p className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <MapPin className="size-4" /> {s.venue}
                          </span>
                          <span className="flex items-center gap-2">
                            <Users className="size-4" /> {s.booked}/{s.capacity} registered
                          </span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={full || event.alreadyBooked || register.isPending}
                        onClick={() => register.mutate(s.id)}
                      >
                        {full ? "Full" : event.alreadyBooked ? "Registered" : "Register"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
