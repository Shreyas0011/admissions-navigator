import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel relative min-w-[9.5rem] overflow-hidden rounded-2xl px-5 py-4",
        accent && "border-l-0",
        className,
      )}
    >
      {accent && (
        <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-warning" aria-hidden />
      )}
      <p className="label-caps text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-3xl font-bold tracking-tight tabular-nums",
          accent ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
