import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgrammeTable } from "@/components/programmes/ProgrammeTable";
import { ProgrammeForm } from "@/components/programmes/ProgrammeForm";
import { listProgrammesFn } from "@/domains/programmes/programmes.functions";

export const Route = createFileRoute("/_authenticated/programmes/")({
  head: () => ({
    meta: [
      { title: "Programme Registry — Admissions OS" },
      {
        name: "description",
        content: "Configure courses, intakes and application windows for every admissions cycle.",
      },
    ],
  }),
  component: ProgrammesPage,
});

function ProgrammesPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["programmes"],
    queryFn: () => listProgrammesFn(),
  });

  const rows = data ?? [];
  const totalApplications = rows.reduce((sum, p) => sum + p.applications, 0);
  const openCount = rows.filter((p) => p.status === "OPEN").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Course management"
        title="Programme Registry"
        description="The source of truth of the system: every application, event and assignment rule hangs off a programme."
        actions={
          <>
            <StatCard label="Programmes" value={rows.length} />
            <StatCard label="Open" value={openCount} accent />
            <StatCard label="Applications" value={totalApplications} />
            <Button className="h-auto rounded-2xl px-6" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New Programme
            </Button>
          </>
        }
      />

      <section className="surface-card overflow-hidden rounded-2xl">
        {isLoading ? <Skeleton className="h-64" /> : <ProgrammeTable rows={rows} />}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New programme</DialogTitle>
          </DialogHeader>
          <ProgrammeForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
