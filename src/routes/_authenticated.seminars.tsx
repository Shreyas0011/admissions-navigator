import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, QrCode, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { getSeminars } from "@/domains/events/events.functions";

export const Route = createFileRoute("/_authenticated/seminars")({
  head: () => ({
    meta: [
      { title: "Seminars & Attendance — Admissions OS" },
      {
        name: "description",
        content: "Walk-in Orientation and Admission Counselling sessions with live booking counts.",
      },
    ],
  }),
  component: SeminarsPage,
});

function SeminarsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["seminars"],
    queryFn: () => getSeminars(),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Counselling"
        title="Seminars"
        description="WOC and ACC sessions, their capacity and QR attendance progress."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((seminar) => {
            const fill = Math.round((seminar.booked / Math.max(seminar.capacity, 1)) * 100);
            return (
              <article key={seminar.id} className="surface-card rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="label-caps text-primary">{seminar.seminar_type}</span>
                    <h2 className="mt-1 text-xl font-semibold text-foreground">{seminar.title}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      seminar.is_open
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {seminar.is_open ? "Bookings open" : "Closed"}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4" />
                    {new Date(seminar.scheduled_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {seminar.venue}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    {seminar.booked} booked of {seminar.capacity} seats
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode className="size-4" />
                    {seminar.attended} scanned in
                  </div>
                </dl>

                <Progress value={fill} className="mt-5 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{fill}% of capacity booked</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
