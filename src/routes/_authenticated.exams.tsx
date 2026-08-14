import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Clock, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { EventForm } from "@/components/events/EventForm";
import { publishEventFn } from "@/domains/events/events.functions";
import { listExamEventsFn } from "@/domains/exams/exams.functions";
import { formatDateTime } from "@/lib/datetime";
import { AdminOnly } from "@/components/shared/AdminOnly";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exam Builder & Hall Tickets — Admissions OS" },
      {
        name: "description",
        content:
          "Create entrance exam sessions, publish registration and track hall-ticket readiness.",
      },
      { property: "og:title", content: "Exam Builder & Hall Tickets — Admissions OS" },
      {
        property: "og:description",
        content: "Schedule entrance exams and manage candidate registration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuardedExamsPage,
});

function ExamsPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["exam-events"],
    queryFn: () => listExamEventsFn(),
  });

  const publish = useMutation({
    mutationFn: (vars: { id: string; isOpen: boolean }) => publishEventFn({ data: vars }),
    onSuccess: () => {
      toast.success("Exam updated");
      queryClient.invalidateQueries({ queryKey: ["exam-events"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Entrance"
        title="Exam builder"
        description="Exams use the same scheduling engine as seminars — sessions, venues, capacity and self-registration, plus hall tickets."
        actions={
          <Button className="h-auto rounded-2xl px-6" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New exam
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New exam</DialogTitle>
          </DialogHeader>
          <EventForm lockedType="EXAM" onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No exams scheduled"
          description="Create an exam to open candidate registration and hall-ticket downloads."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((exam) => (
            <article key={exam.id} className="surface-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label-caps text-primary">Exam</span>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">{exam.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {exam.programmes?.name ?? "All programmes"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    exam.is_open ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {exam.is_open ? "Published" : "Draft"}
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="size-4" /> {exam.config.duration_minutes} minutes
                </div>
                {exam.sessions.slice(0, 3).map((session) => (
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
                {exam.sessions.length === 0 ? <div>No exam sessions scheduled yet.</div> : null}
              </dl>

              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  variant={exam.is_open ? "outline" : "default"}
                  onClick={() => publish.mutate({ id: exam.id, isOpen: !exam.is_open })}
                >
                  {exam.is_open ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/seminars/$eventId" params={{ eventId: exam.id }}>
                    Sessions, password & attendance
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function GuardedExamsPage() {
  return (
    <AdminOnly>
      <ExamsPage />
    </AdminOnly>
  );
}
