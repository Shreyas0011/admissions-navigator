import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MapPin, Plus, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventForm } from "@/components/events/EventForm";
import {
  autoAllocateFn,
  listEventsFn,
  publishEventFn,
} from "@/domains/events/events.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/_authenticated/seminars/")({
  head: () => ({
    meta: [
      { title: "Seminar Builder — Admissions OS" },
      {
        name: "description",
        content: "Publish events, manage sessions and auto-allocate students to available seats.",
      },
    ],
  }),
  component: SeminarsPage,
});

function SeminarsPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEventsFn({ data: undefined }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const publish = useMutation({
    mutationFn: (vars: { id: string; isOpen: boolean }) => publishEventFn({ data: vars }),
    onSuccess: () => {
      toast.success("Event updated");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allocate = useMutation({
    mutationFn: (id: string) => autoAllocateFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(result.message);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scheduling engine"
        title="Seminar builder"
        description="Events define what happens; sessions define when and where. Publish to open self-registration."
        actions={
          <Button className="h-auto rounded-2xl px-6" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Event
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
          </DialogHeader>
          <EventForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((event) => {
            const fill = Math.round((event.booked / Math.max(event.capacity, 1)) * 100);
            return (
              <article key={event.id} className="surface-card rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="label-caps text-primary">{event.event_type}</span>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">{event.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {event.programmes?.name ?? "All programmes"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.is_open
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {event.is_open ? "Published" : "Draft"}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {event.sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="size-4" />
                        {formatDateTime(session.starts_at)}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        {session.venues?.name ?? "Venue TBC"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="size-4" />
                        {session.booked}/{session.capacity}
                      </span>
                    </div>
                  ))}
                  {event.sessions.length === 0 ? <div>No sessions scheduled yet.</div> : null}
                </dl>

                <Progress value={fill} className="mt-5 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{fill}% of capacity booked</p>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant={event.is_open ? "outline" : "default"}
                    onClick={() => publish.mutate({ id: event.id, isOpen: !event.is_open })}
                  >
                    {event.is_open ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => allocate.mutate(event.id)}
                    disabled={allocate.isPending}
                  >
                    <Wand2 className="mr-1 size-4" /> Auto-allocate
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/seminars/$eventId" params={{ eventId: event.id }}>
                      Manage
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
