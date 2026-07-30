import { cn } from "@/lib/utils";
import { STAGE_MAP } from "@/config/constants";
import type { AdmissionStage } from "@/domains/admissions/types";

const TONE_CLASSES = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-primary",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

export function StageBadge({
  stage,
  className,
  short = false,
}: {
  stage: AdmissionStage;
  className?: string;
  short?: boolean;
}) {
  const meta = STAGE_MAP[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {short ? meta.short : meta.label}
    </span>
  );
}
