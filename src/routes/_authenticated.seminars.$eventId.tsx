import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { SessionAttendancePanel } from "@/components/attendance/SessionAttendancePanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { autoAllocateFn, getEventFn, publishEventFn } from "@/domains/events/events.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/_authenticated/seminars/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Sessions — Admissions OS" },
      { name: "description", content: "Sessions, seat usage and bookings for a single event." },
    ],
  }),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventFn({ data: { id: eventId } }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["event", eventId] });

  const publish = useMutation({
    mutationFn: (isOpen: boolean) => publishEventFn({ data: { id: eventId, isOpen } }),
    onSuccess: () => {
      toast.success("Event updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allocate = useMutation({
    mutationFn: () => autoAllocateFn({ data: { id: eventId } }),
    onSuccess: (result) => {
      toast.success(result.message);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <Skeleton className="h-72 rounded-2xl" />;
  const { event, bookings } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={event.event_type}
        title={event.title}
        description={`Allocation ${event.allocation_strategy.replace(/_/g, " ")} · target stage ${event.target_stage ?? "any"}`}
        actions={
          <>
            <StatCard label="Capacity" value={event.capacity} />
            <StatCard label="Booked" value={event.booked} accent />
            <Button variant="outline" onClick={() => publish.mutate(!event.is_open)}>
              {event.is_open ? "Unpublish" : "Publish"}
            </Button>
            <Button disabled={allocate.isPending} onClick={() => allocate.mutate()}>
              <Wand2 className="size-4" /> Auto-allocate
            </Button>
          </>
        }
      />

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
        <ul className="mt-4 space-y-3">
          {event.sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-foreground">
                  <CalendarClock className="size-4" />
                  {formatDateTime(s.starts_at)}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" /> {s.venues?.name ?? "Venue TBC"}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" /> {s.booked}/{s.capacity} · {s.seatsLeft} left
                </span>
              </div>
              <SessionAttendancePanel sessionId={s.id} groundPassword={s.ground_password} />
            </li>
          ))}
          {event.sessions.length === 0 && (
            <li className="text-sm text-muted-foreground">No sessions scheduled.</li>
          )}
        </ul>

      </section>

      <section className="surface-card overflow-hidden rounded-2xl">
        <h2 className="px-6 pt-6 text-lg font-semibold text-foreground">Bookings</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr className="label-caps text-muted-foreground">
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Booked at</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-6 py-4 font-mono text-xs text-primary">{b.booking_ref}</td>
                  <td className="px-6 py-4 text-foreground">
                    {b.students?.full_name ?? "—"}
                    <span className="block font-mono text-xs text-muted-foreground">
                      {b.students?.student_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">{b.status}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDateTime(b.booked_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
