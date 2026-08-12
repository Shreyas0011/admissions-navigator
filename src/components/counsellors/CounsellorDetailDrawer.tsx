import { useQuery } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StageBadge } from "@/components/shared/StageBadge";
import { getCounsellorDetailFn } from "@/domains/counsellors/counsellors.functions";
import type { AdmissionStage } from "@/domains/admissions/types";
import { formatDateTime } from "@/lib/datetime";

/** Admin view of one counsellor: allocated students, progress and call logs. */
export function CounsellorDetailDrawer({
  counsellorId,
  onClose,
}: {
  counsellorId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["counsellor-detail", counsellorId],
    queryFn: () => getCounsellorDetailFn({ data: { id: counsellorId! } }),
    enabled: Boolean(counsellorId),
  });

  return (
    <Sheet open={Boolean(counsellorId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{data?.counsellor.full_name ?? "Counsellor"}</SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <Skeleton className="mt-6 h-64 rounded-2xl" />
        ) : (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              {data.counsellor.email}
              {data.counsellor.phone ? ` · ${data.counsellor.phone}` : ""} ·{" "}
              {data.students.length} allocated
              {data.counsellor.must_reset_password ? " · password reset pending" : ""}
            </p>

            {data.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students allocated yet.</p>
            ) : (
              data.students.map((student) => {
                const calls = data.calls.filter((c) => c.student_id === student.id);
                return (
                  <article key={student.id} className="rounded-2xl bg-surface-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-primary">{student.student_code}</p>
                        <h3 className="font-semibold text-foreground">{student.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {student.programmes?.name ?? "No programme"} · {student.phone}
                        </p>
                      </div>
                      <StageBadge stage={student.stage as AdmissionStage} />
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Call logs ({calls.length})
                      </p>
                      {calls.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No calls recorded.</p>
                      ) : (
                        calls.map((call) => (
                          <div key={call.id} className="rounded-xl bg-background px-3 py-2 text-xs">
                            <p className="font-medium text-foreground">
                              {call.outcome.replace(/_/g, " ").toLowerCase()} ·{" "}
                              {formatDateTime(call.called_at)}
                            </p>
                            {call.notes && (
                              <p className="mt-1 text-muted-foreground">{call.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
