import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getExams } from "@/domains/events/events.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exams & Hall Tickets — Admissions OS" },
      { name: "description", content: "Entrance exam slots, centres and hall-ticket readiness." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["exams"], queryFn: () => getExams() });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Entrance"
        title="Exams"
        description="Scheduled entrance exams and the students eligible for a hall ticket."
        actions={
          data ? <StatCard label="Exam ready" value={data.examReadyStudents} accent /> : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.exams ?? []).map((exam) => (
            <article key={exam.id} className="surface-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground">{exam.title}</h2>
              <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  {formatDateTime(exam.scheduled_at)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {exam.centre}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  {exam.capacity} seats
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
