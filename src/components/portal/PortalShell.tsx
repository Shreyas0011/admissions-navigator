import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { APP_NAME } from "@/config/constants";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/portal", label: "My application" },
  { to: "/portal/progress", label: "Progress" },
  { to: "/portal/counsellor", label: "Counsellor" },
  { to: "/portal/seminars", label: "Seminars" },
  { to: "/portal/exams", label: "Exams" },
] as const;

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-low">
      <header className="bg-sidebar">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-bold text-sidebar-accent-foreground">
                {APP_NAME}
              </span>
              <span className="block text-xs text-sidebar-foreground/70">Student portal</span>
            </span>
          </span>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-sidebar-border px-4 py-2 text-sm text-sidebar-accent-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {TABS.map((tab) => {
            const active = pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "rounded-t-xl px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-surface-low text-foreground"
                    : "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
