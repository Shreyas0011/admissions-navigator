import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/shared/PageHeader";
import { CounsellorCreateForm } from "@/components/counsellors/CounsellorCreateForm";
import { CounsellorList } from "@/components/counsellors/CounsellorList";
import { CounsellorDetailDrawer } from "@/components/counsellors/CounsellorDetailDrawer";
import { AdminOnly } from "@/components/shared/AdminOnly";

export const Route = createFileRoute("/_authenticated/counsellors")({
  head: () => ({
    meta: [
      { title: "Counsellors — Admissions OS" },
      {
        name: "description",
        content: "Create counsellor logins and review allocated students, progress and call logs.",
      },
      { property: "og:title", content: "Counsellors — Admissions OS" },
      {
        property: "og:description",
        content: "Counsellor directory, workload and call history for admissions staff.",
      },
    ],
  }),
  component: GuardedCounsellorsPage,
});

function CounsellorsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team"
        title="Counsellors"
        description="Issue logins, review workload and drill into every allocated student and call log."
      />
      <CounsellorCreateForm />
      <CounsellorList onSelect={setSelected} />
      <CounsellorDetailDrawer counsellorId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function GuardedCounsellorsPage() {
  return (
    <AdminOnly>
      <CounsellorsPage />
    </AdminOnly>
  );
}
