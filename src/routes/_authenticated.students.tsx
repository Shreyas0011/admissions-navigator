import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentTable } from "@/components/students/StudentTable";
import { StudentFilters, type RegistryFilters } from "@/components/students/StudentFilters";
import { StudentDetailDrawer } from "@/components/students/StudentDetailDrawer";
import { EnquiryForm } from "@/components/students/EnquiryForm";
import { BulkUploadPanel } from "@/components/students/BulkUploadPanel";
import { listStudents } from "@/domains/students/students.functions";
import { listCounsellors } from "@/domains/counsellors/counsellors.functions";
import { PAGE_SIZE } from "@/config/constants";
import type { AdmissionStage } from "@/domains/admissions/types";

export const Route = createFileRoute("/_authenticated/students")({
  validateSearch: z.object({ new: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Students Registry — Admissions OS" },
      {
        name: "description",
        content:
          "Search, filter and progress every admissions lead through the counselling and exam pipeline.",
      },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [filters, setFilters] = useState<RegistryFilters>({
    search: "",
    stage: "ALL",
    counsellorId: "ALL",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const queryInput = useMemo(
    () => ({
      search: filters.search || undefined,
      stage: filters.stage === "ALL" ? undefined : (filters.stage as AdmissionStage),
      counsellorId: filters.counsellorId === "ALL" ? undefined : filters.counsellorId,
      page,
      pageSize: PAGE_SIZE,
      sortBy: "created_at" as const,
      order: "desc" as const,
    }),
    [filters, page],
  );

  const { data, isFetching } = useQuery({
    queryKey: ["students", queryInput],
    queryFn: () => listStudents({ data: queryInput }),
    placeholderData: (prev) => prev,
  });

  const { data: counsellors } = useQuery({
    queryKey: ["counsellors"],
    queryFn: () => listCounsellors(),
    staleTime: 5 * 60_000,
  });

  const rows = data?.rows ?? [];
  const stats = data?.stats;

  function updateFilters(next: Partial<RegistryFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("Nothing to export on this page");
      return;
    }
    const header = ["Student ID", "Name", "Course", "Email", "Phone", "Stage", "Counsellor"];
    const body = rows.map((r) =>
      [
        r.student_code,
        r.full_name,
        r.course ?? "",
        r.email,
        r.phone,
        r.stage,
        r.counsellor_name ?? "Unassigned",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admissions Pipeline"
        title="Students Registry"
        description="Every enquiry, counselling session and exam booking in one auditable pipeline."
        actions={
          <>
            {stats && (
              <>
                <StatCard label="Total Active" value={stats.totalActive} />
                <StatCard label="WOC Pending" value={stats.wocPending} accent />
                <StatCard label="New Leads" value={stats.newLeads} />
              </>
            )}
            <Button
              variant="outline"
              className="h-auto rounded-2xl px-6"
              onClick={() => setBulkOpen(true)}
            >
              <Upload className="size-4" />
              Bulk upload
            </Button>
            <Button
              className="h-auto rounded-2xl px-6"
              onClick={() => navigate({ search: { new: true } })}
            >
              <Plus className="size-4" />
              New Application
            </Button>
          </>
        }
      />

      <section className="surface-card overflow-hidden rounded-2xl">
        <StudentFilters
          filters={filters}
          counsellors={counsellors ?? []}
          onChange={updateFilters}
          onExport={exportCsv}
        />
        <StudentTable
          rows={rows}
          loading={isFetching && !data}
          selected={selected}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onToggleAll={() =>
            setSelected((prev) =>
              rows.every((r) => prev.includes(r.id)) ? [] : rows.map((r) => r.id),
            )
          }
          onOpen={(row) => setOpenStudentId(row.id)}
        />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </section>

      <StudentDetailDrawer studentId={openStudentId} onClose={() => setOpenStudentId(null)} />

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk upload students</DialogTitle>
          </DialogHeader>
          <BulkUploadPanel />
        </DialogContent>
      </Dialog>


      <Dialog
        open={Boolean(search.new)}
        onOpenChange={(open) => !open && navigate({ search: {} })}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New application</DialogTitle>
          </DialogHeader>
          <EnquiryForm defaultSource="WALK_IN" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
