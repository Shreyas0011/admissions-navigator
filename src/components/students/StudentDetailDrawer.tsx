import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRight, BookOpen, Mail, Phone, School, User, Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StageBadge } from "@/components/shared/StageBadge";
import { STAGE_MAP } from "@/config/constants";
import { nextStages } from "@/domains/admissions/types";
import type { AdmissionStage } from "@/domains/admissions/types";
import { getStudentDetailFn, moveStudentStage } from "@/domains/students/students.functions";
import { runAssignmentFn } from "@/domains/assignment/assignment.functions";
import { formatDateTime } from "@/lib/datetime";

function formatDate(value: string) {
  return formatDateTime(value);
}

export function StudentDetailDrawer({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudentDetailFn({ data: { id: studentId! } }),
    enabled: Boolean(studentId),
  });

  const transition = useMutation({
    mutationFn: (toStage: AdmissionStage) =>
      moveStudentStage({ data: { studentId: studentId!, toStage } }),
    onSuccess: (result) => {
      toast.success(`Moved to ${STAGE_MAP[result.to as AdmissionStage].label}`);
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assign = useMutation({
    mutationFn: () => runAssignmentFn({ data: { studentId: studentId! } }),
    onSuccess: (decision) => {
      if (decision.assigned) toast.success(`Assigned to ${decision.counsellorName}`);
      else toast.error(decision.reason ?? "No counsellor could be matched");
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["engine-console"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const student = data?.student;

  return (
    <Sheet open={Boolean(studentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {isLoading || !student ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="space-y-1 border-b border-border pb-5">
              <p className="font-mono text-xs text-primary">{student.student_code}</p>
              <SheetTitle className="text-2xl">{student.full_name}</SheetTitle>
              <SheetDescription>
                {student.course ?? "Course undecided"} · Enquired {formatDate(student.created_at)}
              </SheetDescription>
              <div className="pt-2">
                <StageBadge stage={student.stage as AdmissionStage} />
              </div>
            </SheetHeader>

            <div className="space-y-8 px-4 py-6">
              <section className="grid gap-4 sm:grid-cols-2">
                <Field icon={<Phone className="size-4" />} label="Phone" value={student.phone} />
                <Field icon={<Mail className="size-4" />} label="Email" value={student.email} />
                <Field
                  icon={<User className="size-4" />}
                  label="Parent / Guardian"
                  value={
                    student.parent_name
                      ? `${student.parent_name}${student.parent_phone ? ` · ${student.parent_phone}` : ""}`
                      : "Not provided"
                  }
                />
                <Field
                  icon={<School className="size-4" />}
                  label="School"
                  value={student.school ?? "Not provided"}
                />
                <Field
                  icon={<User className="size-4" />}
                  label="Counsellor"
                  value={student.counsellor_name ?? "Unassigned"}
                />
                <Field
                  icon={<BookOpen className="size-4" />}
                  label="Programme applied to"
                  value={data?.programme?.name ?? "Not selected"}
                />
                <Field
                  icon={<ArrowRight className="size-4" />}
                  label="Lead source"
                  value={student.lead_source.replace("_", " ").toLowerCase()}
                />
              </section>

              <section>
                <h3 className="label-caps text-muted-foreground">Assignment engine</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" disabled={assign.isPending} onClick={() => assign.mutate()}>
                    {assign.isPending ? (
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 size-3.5" />
                    )}
                    {student.counsellor_name ? "Reassign" : "Auto-assign"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Runs the active policy: rule → pool → algorithm.
                  </span>
                </div>
                <ol className="mt-4 space-y-3">
                  {(data?.assignments ?? []).map((row) => (
                    <li key={row.id} className="rounded-xl bg-surface-low px-4 py-3 text-xs">
                      <p className="text-sm font-medium text-foreground">
                        {row.counsellors?.full_name ?? "No match"} ·{" "}
                        {row.algorithm?.replace(/_/g, " ") ?? "—"} ({row.source})
                      </p>
                      <p className="text-muted-foreground">
                        {row.rule_label} · {formatDate(row.created_at)}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Candidates:{" "}
                        {(row.candidates ?? []).map((c) => `${c.name} (${c.activeLeads})`).join(", ") ||
                          "none"}
                      </p>
                    </li>
                  ))}
                  {(data?.assignments ?? []).length === 0 && (
                    <li className="text-xs text-muted-foreground">No assignment history yet.</li>
                  )}
                </ol>
              </section>

              <section>
                <h3 className="label-caps text-muted-foreground">Seminar bookings</h3>
                <ul className="mt-3 space-y-2">
                  {(data?.bookings ?? []).map((b) => (
                    <li key={b.id} className="rounded-xl bg-surface-low px-4 py-3 text-xs">
                      <span className="text-sm font-medium text-foreground">
                        {b.events?.title ?? "Session"}
                      </span>{" "}
                      <span className="font-mono text-primary">{b.booking_ref}</span>
                      <p className="text-muted-foreground">
                        {b.event_sessions
                          ? `${formatDate(b.event_sessions.starts_at)} · ${b.event_sessions.venues?.name ?? "Venue TBC"}`
                          : "Schedule TBC"}{" "}
                        · {b.status}
                      </p>
                    </li>
                  ))}
                  {(data?.bookings ?? []).length === 0 && (
                    <li className="text-xs text-muted-foreground">No bookings yet.</li>
                  )}
                </ul>
              </section>

              <section>
                <h3 className="label-caps text-muted-foreground">Advance stage</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStages(student.stage as AdmissionStage).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      This student has reached the end of the Phase 1 pipeline.
                    </p>
                  ) : (
                    nextStages(student.stage as AdmissionStage).map((stage) => (
                      <Button
                        key={stage}
                        variant="outline"
                        size="sm"
                        disabled={transition.isPending}
                        onClick={() => transition.mutate(stage)}
                      >
                        {transition.isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                        {STAGE_MAP[stage].label}
                      </Button>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h3 className="label-caps text-muted-foreground">Audit trail</h3>
                <ol className="mt-4 space-y-4 border-l border-border pl-5">
                  {(data?.timeline ?? []).map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute top-1.5 -left-[23px] size-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <p className="text-sm font-medium text-foreground">
                        {event.from_stage
                          ? `${STAGE_MAP[event.from_stage as AdmissionStage].label} → ${STAGE_MAP[event.to_stage as AdmissionStage].label}`
                          : STAGE_MAP[event.to_stage as AdmissionStage].label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.actor_label} · {formatDate(event.created_at)}
                      </p>
                      {event.reason && (
                        <p className="mt-1 text-xs text-muted-foreground italic">{event.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-low px-4 py-3">
      <p className="label-caps flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-words text-foreground capitalize">{value}</p>
    </div>
  );
}
