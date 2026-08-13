import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, ScanLine, XCircle } from "lucide-react";
import { toast } from "sonner";

import { QrScanner } from "@/components/attendance/QrScanner";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  groundBoardFn,
  groundMarkAttendanceFn,
  groundScanFn,
} from "@/domains/attendance/attendance.functions";
import { GROUND_TOKEN_KEY } from "@/domains/attendance/ground.client";
import { formatTime } from "@/lib/datetime";

type Scan = Awaited<ReturnType<typeof groundScanFn>>;

export const Route = createFileRoute("/seminar-day/console")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Check-in Console — Admissions OS" },
      { name: "description", content: "Scan student passes and record seminar attendance live." },
      { property: "og:title", content: "Check-in Console — Admissions OS" },
      { property: "og:description", content: "Live seminar attendance and walk-in console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsolePage,
});

function ConsolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);

  const token = typeof window === "undefined" ? "" : localStorage.getItem(GROUND_TOKEN_KEY) ?? "";

  const board = useQuery({
    queryKey: ["ground", "board", token],
    queryFn: () => groundBoardFn({ data: { token } }),
    enabled: token.length > 0,
    retry: false,
  });

  const resolve = useMutation({
    mutationFn: (payload: string) => groundScanFn({ data: { token, payload } }),
    onSuccess: (result) => {
      setScan(result);
      setScanning(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mark = useMutation({
    mutationFn: (studentId: string) =>
      groundMarkAttendanceFn({ data: { token, studentId, walkIn: false } }),
    onSuccess: (result) => {
      toast.success(result.walkIn ? "Walk-in attendance recorded" : "Attendance recorded");
      setScan(null);
      queryClient.invalidateQueries({ queryKey: ["ground", "board"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function signOut() {
    localStorage.removeItem(GROUND_TOKEN_KEY);
    navigate({ to: "/seminar-day" });
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to a seminar to open the console.</p>
        <Button onClick={() => navigate({ to: "/seminar-day" })}>Back to sign in</Button>
      </div>
    );
  }
  if (board.isLoading) return <Skeleton className="m-6 h-96 rounded-2xl" />;
  if (board.error) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 py-16 text-center">
        <p className="text-sm text-destructive">{(board.error as Error).message}</p>
        <Button onClick={() => navigate({ to: "/seminar-day" })}>Back to sign in</Button>
      </div>
    );
  }
  const data = board.data!;
  const canMark = scan?.status === "REGISTERED" || scan?.status === "WALK_IN_AVAILABLE";

  return (
    <div className="min-h-screen bg-surface-low">
      <header className="bg-sidebar px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-sidebar-accent-foreground">{data.session.title}</p>
            <p className="text-xs text-sidebar-foreground/70">
              {data.session.venue} ·{" "}
              {formatTime(data.session.startsAt)}{" "}
              · Staff: {data.staffName}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-sidebar-border px-3 py-2 text-sm text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Exit
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Capacity" value={data.stats.capacity} />
          <StatCard label="Registered" value={data.stats.registered} />
          <StatCard label="Present" value={data.stats.present} accent />
          <StatCard label="Seats left" value={data.stats.seatsLeft} />
        </div>

        <section className="surface-card space-y-4 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Scan student pass</h2>
            <Button variant={scanning ? "outline" : "default"} onClick={() => setScanning((s) => !s)}>
              <ScanLine className="size-4" /> {scanning ? "Stop camera" : "Start camera"}
            </Button>
          </div>

          {scanning && (
            <QrScanner
              active={scanning}
              onResult={(text) => {
                if (resolve.isPending) return;
                resolve.mutate(text);
              }}
            />
          )}

          {scan && (
            <div className="rounded-2xl border border-border p-5">
              <p className="text-lg font-semibold text-foreground">
                {scan.student?.fullName ?? "Unknown pass"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {scan.student?.studentCode ?? "—"}
              </p>
              <p className={canMark ? "mt-3 text-sm text-primary" : "mt-3 text-sm text-destructive"}>
                {scan.message}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {canMark ? (
                  <Button disabled={mark.isPending} onClick={() => mark.mutate(scan.student!.id)}>
                    <Check className="size-4" />
                    {scan.status === "WALK_IN_AVAILABLE"
                      ? "Mark walk-in attendance"
                      : "Mark attendance"}
                  </Button>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="size-4" /> Cannot record attendance
                  </span>
                )}
                <Button variant="outline" onClick={() => setScan(null)}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="surface-card overflow-hidden rounded-2xl">
          <h2 className="px-6 pt-6 text-lg font-semibold text-foreground">Checked in</h2>
          <ul className="mt-4 divide-y divide-border">
            {data.attendance.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">
                Nobody checked in yet.
              </li>
            )}
            {data.attendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <span>
                  <span className="font-medium text-foreground">
                    {a.students?.full_name ?? "Student"}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {a.students?.student_code}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {a.is_walk_in ? "Walk-in" : "Registered"} ·{" "}
                  {formatTime(a.scanned_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
