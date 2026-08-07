import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSessionAttendanceFn,
  setGroundPasswordFn,
} from "@/domains/attendance/attendance.functions";

type Props = {
  sessionId: string;
  groundPassword: string | null;
};

export function SessionAttendancePanel({ sessionId, groundPassword }: Props) {
  const queryClient = useQueryClient();
  const [reveal, setReveal] = useState(false);
  const [password, setPassword] = useState(groundPassword);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", sessionId],
    queryFn: () => getSessionAttendanceFn({ data: { sessionId } }),
  });

  const generate = useMutation({
    mutationFn: () => setGroundPasswordFn({ data: { sessionId } }),
    onSuccess: (result) => {
      setPassword(result.password);
      setReveal(true);
      toast.success("Ground password generated");
      queryClient.invalidateQueries({ queryKey: ["attendance", sessionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const present = data?.attendance ?? [];
  const walkIns = present.filter((a) => a.is_walk_in);

  return (
    <div className="mt-4 space-y-5 rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center gap-3">
        <KeyRound className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Ground staff password</span>
        <span className="font-mono text-sm text-muted-foreground">
          {password ? (reveal ? password : "••••••••") : "Not generated"}
        </span>
        {password && (
          <Button size="sm" variant="ghost" onClick={() => setReveal((r) => !r)}>
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {reveal ? "Hide" : "View"}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={generate.isPending} onClick={() => generate.mutate()}>
          <RefreshCcw className="size-4" /> {password ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <Stat label="Registered" value={data?.stats.registered ?? 0} />
            <Stat label="Present" value={data?.stats.present ?? 0} />
            <Stat label="Walk-ins" value={walkIns.length} />
            <Stat label="Seats left" value={data?.stats.seatsLeft ?? 0} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <List
              title="Registered"
              rows={(data?.bookings ?? []).map((b) => ({
                id: b.id,
                name: b.students?.full_name ?? "Student",
                code: b.students?.student_code ?? "—",
                meta: b.status,
              }))}
            />
            <List
              title="Present"
              rows={present.map((a) => ({
                id: a.id,
                name: a.students?.full_name ?? "Student",
                code: a.students?.student_code ?? "—",
                meta: `${a.is_walk_in ? "Walk-in" : "Registered"} · ${new Date(a.scanned_at).toLocaleTimeString()}`,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container p-3">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function List({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; code: string; meta: string }[];
}) {
  return (
    <div>
      <p className="label-caps text-muted-foreground">{title}</p>
      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">None yet.</li>
        )}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <span className="font-medium text-foreground">{r.name}</span>
              <span className="block font-mono text-xs text-muted-foreground">{r.code}</span>
            </span>
            <span className="text-xs text-muted-foreground">{r.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
