import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { listMySessionsFn, registerForSessionFn } from "@/domains/portal/portal.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/portal/seminars")({
  head: () => ({
    meta: [
      { title: "Seminar Registration — Admissions OS" },
      { name: "description", content: "Choose and book an orientation or counselling seminar slot." },
      { property: "og:title", content: "Seminar Registration — Admissions OS" },
      { property: "og:description", content: "Book your orientation seminar slot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalSeminars,
});

function PortalSeminars() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "sessions"],
    queryFn: () => listMySessionsFn(),
  });

  const register = useMutation({
    mutationFn: (sessionId: string) => registerForSessionFn({ data: { sessionId } }),
    onSuccess: (booking) => {
      toast.success(`Seat confirmed — ${booking.booking_ref}`);
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Self-registration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Available seminars
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only sessions you are eligible for, with live seat availability.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="Nothing to register for yet"
          description="Sessions appear here once your counsellor moves you to the right stage and an event is published for your programme."
        />
      ) : (
        <div className="space-y-4">
          {(data ?? []).map((event) => (
            <article key={event.id} className="surface-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label-caps text-primary">{event.eventType}</span>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{event.title}</h2>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
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
                            <Users className="size-4" /> {s.booked}/{s.capacity} booked
                          </span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={full ? "outline" : "default"}
                        disabled={full || event.alreadyBooked || register.isPending}
                        onClick={() => register.mutate(s.id)}
                      >
                        {full
                          ? s.waitlistEnabled
                            ? "Full — waitlist"
                            : "Full"
                          : event.alreadyBooked
                            ? "Already booked"
                            : "Register"}
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
