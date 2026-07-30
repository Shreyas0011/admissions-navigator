import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowRight, Mail, Phone, School, User } from "lucide-react";
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
import { getStudent, moveStudentStage } from "@/domains/students/students.functions";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    queryFn: () => getStudent({ data: { id: studentId! } }),
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
                  icon={<ArrowRight className="size-4" />}
                  label="Lead source"
                  value={student.lead_source.replace("_", " ").toLowerCase()}
                />
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
