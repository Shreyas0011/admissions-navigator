import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, Plus, LifeBuoy, LogOut } from "lucide-react";

import { APP_NAME, APP_TAGLINE, NAV_ITEMS } from "@/config/constants";
import type { AppRole } from "@/domains/admissions/types";
import { cn } from "@/lib/utils";

export function Sidebar({
  roles,
  onSignOut,
  onNewApplication,
}: {
  roles: AppRole[];
  onSignOut: () => void;
  onNewApplication: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = NAV_ITEMS.filter((item) => item.roles.some((r) => roles.includes(r)));

  return (
    <aside className="flex w-[280px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-6" />
        </span>
        <span>
          <span className="block text-xl font-bold tracking-tight text-sidebar-accent-foreground">
            {APP_NAME}
          </span>
          <span className="block text-xs text-sidebar-foreground/70">{APP_TAGLINE}</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        {visible.map((item) => {
          const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-level-2)]"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-4 pt-4 pb-6">
        <button
          type="button"
          onClick={onNewApplication}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sidebar-accent px-4 py-3.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-border"
        >
          <Plus className="size-4" />
          New Application
        </button>

        <a
          href="mailto:support@admissions.edu"
          className="mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LifeBuoy className="size-[18px]" />
          Support
        </a>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
