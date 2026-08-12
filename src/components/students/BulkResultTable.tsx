import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { bulkImportStudents } from "@/domains/students/students.functions";

type Result = Awaited<ReturnType<typeof bulkImportStudents>>;

/** Credentials to hand to the imported students — shown once, after import. */
export function BulkResultTable({ results, onDone }: { results: Result; onDone: () => void }) {
  const created = results.filter((r) => r.status === "CREATED");

  function copyAll() {
    const text = created
      .map((r) => `${r.fullName}\t${r.email}\t${r.password}\t${r.studentCode}`)
      .join("\n");
    void navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  }

  function downloadCsv() {
    const header = ["Student ID", "Name", "Email", "Temporary password", "Counsellor"];
    const body = created.map((r) =>
      [r.studentCode ?? "", r.fullName, r.email, r.password ?? "", r.counsellorName ?? "Unassigned"]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "imported-student-credentials.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-container p-4 text-sm">
        <p className="font-medium text-foreground">
          {created.length} imported ·{" "}
          {results.filter((r) => r.status === "SKIPPED").length} skipped ·{" "}
          {results.filter((r) => r.status === "FAILED").length} failed
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share each email and temporary password with the student. They will be asked to set their
          own password the first time they sign in.
        </p>
      </div>

      <div className="max-h-80 overflow-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Temporary password</th>
              <th className="px-3 py-2">Counsellor</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.email} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground">
                  {r.fullName}
                  {r.studentCode ? ` · ${r.studentCode}` : ""}
                </td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2 font-mono">{r.password ?? "—"}</td>
                <td className="px-3 py-2">{r.counsellorName ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.status === "CREATED" ? "Created" : `${r.status}: ${r.message ?? ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copyAll} disabled={created.length === 0}>
          <Copy className="size-4" /> Copy credentials
        </Button>
        <Button size="sm" variant="outline" onClick={downloadCsv} disabled={created.length === 0}>
          <Download className="size-4" /> Download CSV
        </Button>
        <Button size="sm" onClick={onDone}>
          Import another file
        </Button>
      </div>
    </div>
  );
}
