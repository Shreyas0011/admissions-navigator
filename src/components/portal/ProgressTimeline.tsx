import { Check, Circle } from "lucide-react";

import { STAGE_MAP } from "@/config/constants";
import type { AdmissionStage } from "@/domains/admissions/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";

export type ProgressStep = {
  stage: AdmissionStage;
  reached: boolean;
  current: boolean;
  at: string | null;
};

export function ProgressTimeline({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.stage} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border",
                step.current
                  ? "border-primary bg-primary text-primary-foreground"
                  : step.reached
                    ? "border-success bg-success-soft text-success"
                    : "border-border bg-background text-muted-foreground",
              )}
            >
              {step.reached && !step.current ? (
                <Check className="size-4" />
              ) : (
                <Circle className="size-3" />
              )}
            </span>
            {index < steps.length - 1 && (
              <span
                className={cn("w-px flex-1", step.reached ? "bg-success/40" : "bg-border")}
                style={{ minHeight: 28 }}
              />
            )}
          </div>
          <div className="pb-6">
            <p
              className={cn(
                "text-sm font-medium",
                step.current ? "text-primary" : step.reached ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {STAGE_MAP[step.stage].label}
            </p>
            <p className="text-xs text-muted-foreground">
              {step.at
                ? formatDateTime(step.at)
                : step.current
                  ? "In progress"
                  : "Pending"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
