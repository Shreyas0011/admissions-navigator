import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { listEmailQueue } from "@/domains/notifications/notifications.functions";
import { Mail } from "lucide-react";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/_authenticated/emails")({
  head: () => ({
    meta: [
      { title: "Email Queue — Admissions OS" },
      {
        name: "description",
        content: "Simulated transactional email queue for enquiry, booking and hall-ticket notices.",
      },
    ],
  }),
  component: EmailsPage,
});

function EmailsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["email-queue"],
    queryFn: () => listEmailQueue({ data: {} }),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notifications"
        title="Email Queue"
        description="Every module enqueues instead of sending. Swapping in a real provider means draining this queue."
        actions={
          data ? (
            <>
              <StatCard label="Queued" value={data.counts.QUEUED} accent />
              <StatCard label="Sent" value={data.counts.SENT} />
              <StatCard label="Failed" value={data.counts.FAILED} />
            </>
          ) : undefined
        }
      />

      <section className="surface-card overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (data?.rows ?? []).length === 0 ? (
          <EmptyState
            icon={<Mail className="size-6" />}
            title="The queue is empty"
            description="Submitting an enquiry will enqueue a welcome email here."
          />
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-low">
                {["Recipient", "Template", "Subject", "Status", "Created"].map((h) => (
                  <th key={h} className="label-caps px-6 py-3 text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  <td className="px-6 py-3 text-foreground">{row.to_email}</td>
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                    {row.template_key}
                  </td>
                  <td className="max-w-xs truncate px-6 py-3 text-foreground">{row.subject}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
