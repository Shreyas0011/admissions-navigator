import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StageBadge } from "@/components/shared/StageBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listMyLeadsFn } from "@/domains/counsellors/counsellors.functions";
import { logStudentCall, moveStudentStage } from "@/domains/students/students.functions";
import { nextStages, type AdmissionStage } from "@/domains/admissions/types";
import { STAGE_MAP } from "@/config/constants";

const OUTCOMES = [
  "CONNECTED",
  "NO_ANSWER",
  "BUSY",
  "WRONG_NUMBER",
  "NOT_INTERESTED",
  "CALLBACK_REQUESTED",
] as const;

export const Route = createFileRoute("/_authenticated/my-leads")({
  head: () => ({
    meta: [
      { title: "My Leads — Admissions OS" },
      { name: "description", content: "Leads assigned to you, with call logging and stage progression." },
    ],
  }),
  component: MyLeadsPage,
});

function MyLeadsPage() {
  const queryClient = useQueryClient();
  const [callFor, setCallFor] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string>("CONNECTED");
  const [notes, setNotes] = useState("");
  const [calledAt, setCalledAt] = useState(() => localNow());

  const { data, isLoading } = useQuery({ queryKey: ["my-leads"], queryFn: () => listMyLeadsFn() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["my-leads"] });

  const log = useMutation({
    mutationFn: () =>
      logStudentCall({
        data: { studentId: callFor!, outcome: outcome as never, notes, calledAt },
      }),
    onSuccess: () => {
      toast.success("Call logged");
      setCallFor(null);
      setNotes("");
      setCalledAt(localNow());
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advance = useMutation({
    mutationFn: (vars: { studentId: string; toStage: AdmissionStage }) =>
      moveStudentStage({ data: vars }),
    onSuccess: (r) => {
      toast.success(`Moved to ${STAGE_MAP[r.to as AdmissionStage].label}`);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leads = data?.leads ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Counsellor portal"
        title="My Leads"
        description="Everything assigned to you — call, log the outcome and progress the applicant."
        actions={<StatCard label="Assigned" value={leads.length} accent />}
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !data?.counsellor ? (
        <EmptyState
          title="No counsellor profile linked"
          description="Your staff account is not linked to a counsellor record yet. Ask an admin to link it."
        />
      ) : leads.length === 0 ? (
        <EmptyState title="No leads assigned yet" description="Leads appear here as soon as the assignment engine allocates them to you." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leads.map((lead) => (
            <article key={lead.id} className="surface-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-primary">{lead.student_code}</p>
                  <h2 className="text-lg font-semibold text-foreground">{lead.full_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {lead.programmes?.name ?? "No programme"} · {lead.phone}
                  </p>
                </div>
                <StageBadge stage={lead.stage as AdmissionStage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setCallFor(lead.id)}>
                  <Phone className="mr-1 size-4" /> Log call
                </Button>
                {nextStages(lead.stage as AdmissionStage)
                  .slice(0, 2)
                  .map((stage) => (
                    <Button
                      key={stage}
                      size="sm"
                      variant="secondary"
                      disabled={advance.isPending}
                      onClick={() => advance.mutate({ studentId: lead.id, toStage: stage })}
                    >
                      {STAGE_MAP[stage].label}
                    </Button>
                  ))}
              </div>

              {lead.call_logs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Call history ({lead.call_logs.length}) · saved calls cannot be edited
                  </p>
                  {lead.call_logs.slice(0, 4).map((call) => (
                    <div key={call.id} className="rounded-xl bg-surface-low px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">
                        {call.outcome.replace(/_/g, " ").toLowerCase()} ·{" "}
                        {new Date(call.called_at).toLocaleString()}
                      </p>
                      {call.notes && <p className="mt-1 text-muted-foreground">{call.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(callFor)} onOpenChange={(o) => !o && setCallFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a call</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="call-at">Date & time of call</Label>
            <Input
              id="call-at"
              type="datetime-local"
              value={calledAt}
              onChange={(e) => setCalledAt(e.target.value)}
            />
          </div>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTCOMES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.replace(/_/g, " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was discussed?"
          />
          <p className="text-xs text-muted-foreground">
            Call logs are permanent — check the details before saving.
          </p>
          <Button disabled={log.isPending} onClick={() => log.mutate()}>
            Save call log
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** `datetime-local` value for right now, in the counsellor's own timezone. */
function localNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}
