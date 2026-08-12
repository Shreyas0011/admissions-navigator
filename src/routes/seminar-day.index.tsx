import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2, MapPin, ScanLine, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/config/constants";
import { groundLoginFn, listTodaySessionsFn } from "@/domains/attendance/attendance.functions";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/datetime";

export const Route = createFileRoute("/seminar-day/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Seminar Day Check-in — Admissions OS" },
      {
        name: "description",
        content: "Ground staff check-in for today's admission seminars and exam sessions.",
      },
      { property: "og:title", content: "Seminar Day Check-in — Admissions OS" },
      { property: "og:description", content: "Ground staff attendance console for today's events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SeminarDayLogin,
});

function SeminarDayLogin() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [password, setPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ground", "today"],
    queryFn: () => listTodaySessionsFn(),
  });

  const login = useMutation({
    mutationFn: () =>
      groundLoginFn({ data: { sessionId: selected!, staffName, password } }),
    onSuccess: () => navigate({ to: "/seminar-day/console" }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-surface-low">
      <header className="bg-sidebar px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <ScanLine className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-bold text-sidebar-accent-foreground">
              {APP_NAME}
            </span>
            <span className="block text-xs text-sidebar-foreground/70">Seminar day mode</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Today&apos;s sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the session you are staffing, then enter your name and the password given by the
            admissions office.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (data?.length ?? 0) === 0 ? (
          <p className="surface-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No published session is scheduled for today.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data!.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "surface-card w-full rounded-2xl p-5 text-left transition-colors",
                    selected === s.id ? "ring-2 ring-primary" : "hover:bg-surface-container",
                  )}
                >
                  <p className="label-caps text-primary">{s.eventType}</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{s.title}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    {formatTime(s.startsAt)}{" "}
                    –{" "}
                    {formatTime(s.endsAt)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {s.venue}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" /> Capacity {s.capacity}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <form
            className="surface-card space-y-4 rounded-2xl p-6"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="staffName">Your name</Label>
              <Input
                id="staffName"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Ground staff name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groundPassword">Seminar password</Label>
              <Input
                id="groundPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enter check-in console
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
