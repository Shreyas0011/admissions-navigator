import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHallTicketFn } from "@/domains/exams/exams.functions";
import { formatDateTime } from "@/lib/datetime";
import { downloadHallTicketPdf } from "@/lib/hall-ticket-pdf";

export const Route = createFileRoute("/portal/hall-ticket/$bookingId")({
  head: () => ({
    meta: [
      { title: "Exam Hall Ticket — Admissions OS" },
      {
        name: "description",
        content: "Your entrance exam hall ticket with venue, reporting time and QR pass.",
      },
      { property: "og:title", content: "Exam Hall Ticket — Admissions OS" },
      { property: "og:description", content: "Entrance exam hall ticket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HallTicketPage,
});

function HallTicketPage() {
  const { bookingId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["hall-ticket", bookingId],
    queryFn: () => getHallTicketFn({ data: { bookingId } }),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Hall ticket</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 size-4" /> Print
          </Button>
          <Button onClick={() => downloadHallTicketPdf(data)}>
            <Download className="mr-1 size-4" /> Download PDF
          </Button>
        </div>
      </div>

      <article className="surface-card space-y-6 rounded-2xl border border-border p-8">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div>
            <p className="label-caps text-primary">Admissions OS</p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">
              {data.exam.title} — Hall Ticket
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Ticket {data.ticketNumber} · Booking {data.bookingRef}
            </p>
          </div>
          <div className="rounded-xl bg-card p-3">
            <QRCodeSVG value={data.qrPayload} size={128} level="M" marginSize={2} />
          </div>
        </header>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Candidate name" value={data.student.fullName} />
          <Field label="Student number" value={data.student.studentCode} />
          <Field label="Student ID" value={data.student.id} mono />
          <Field label="Contact number" value={data.student.phone} />
          <Field
            label="Exam date & time"
            value={data.exam.startsAt ? formatDateTime(data.exam.startsAt) : "To be announced"}
          />
          <Field
            label="Reporting time"
            value={
              data.exam.reportingAt ? formatDateTime(data.exam.reportingAt) : "30 minutes prior"
            }
          />
          <Field label="Duration" value={`${data.exam.durationMinutes} minutes`} />
          <Field label="Venue" value={data.exam.venue} />
        </dl>

        <section className="rounded-xl border border-border bg-surface-container p-5">
          <p className="text-sm font-semibold text-foreground">Instructions</p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
            {data.exam.instructions}
          </p>
        </section>
      </article>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="label-caps text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-foreground ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}
