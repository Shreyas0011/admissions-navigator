import { useEffect, useState } from "react";
import { Search, Bell, HelpCircle, Moon, Sun, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/config/constants";
import type { AppRole } from "@/domains/admissions/types";

export function TopBar({ name, roles }: { name: string; roles: AppRole[] }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const roleLabel = roles.length ? ROLE_LABELS[roles[0]] : "Staff";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-border bg-background px-8">
      <div className="relative w-full max-w-lg">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students, IDs, or emails..."
          className="h-11 rounded-xl border-transparent bg-surface-low pl-11"
          aria-label="Global search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Notifications">
          <Bell className="size-5" />
        </IconButton>
        <IconButton label="Help">
          <HelpCircle className="size-5" />
        </IconButton>
        <IconButton label="Toggle dark mode" onClick={() => setDark((d) => !d)}>
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </IconButton>

        <span className="mx-3 h-8 w-px bg-border" aria-hidden />

        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials || "AD"}
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold text-primary">{name}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-low hover:text-foreground"
    >
      {children}
    </button>
  );
}
