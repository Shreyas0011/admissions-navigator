import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, STAGES } from "@/config/constants";
import { getCurrentActor } from "@/domains/users/users.functions";
import { CounsellorProfilePanel } from "@/components/counsellors/CounsellorProfilePanel";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Admissions OS" },
      { name: "description", content: "Your account, assigned roles and the configured admissions pipeline." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: actor, isLoading } = useQuery({
    queryKey: ["current-actor"],
    queryFn: () => getCurrentActor(),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Your access level and the stage machine every student is routed through."
      />

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Your account</h2>
        {isLoading || !actor ? (
          <Skeleton className="mt-4 h-16 rounded-xl" />
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-foreground">{actor.label}</p>
            <div className="flex flex-wrap gap-2">
              {actor.roles.length === 0 ? (
                <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
                  No role assigned — contact an administrator
                </span>
              ) : (
                actor.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                  >
                    {ROLE_LABELS[role]}
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {!actor?.isAdmin && <CounsellorProfilePanel />}

      <section className="surface-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">Admission pipeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Students move one step at a time; every change is written to the audit trail.
        </p>
        <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          {STAGES.map((stage, i) => (
            <li key={stage.value} className="flex items-center gap-2">
              <span className="rounded-full bg-surface-low px-3 py-1.5 font-medium text-foreground">
                {i + 1}. {stage.label}
              </span>
              {i < STAGES.length - 1 && <span className="text-muted-foreground">→</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
