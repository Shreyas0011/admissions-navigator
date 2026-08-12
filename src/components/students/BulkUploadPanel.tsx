import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadTemplate, parseUpload, type ParsedRow } from "@/lib/bulk-upload";
import { bulkImportStudents } from "@/domains/students/students.functions";
import { BulkResultTable } from "./BulkResultTable";

type Result = Awaited<ReturnType<typeof bulkImportStudents>>;

/** Admin bulk import: template -> upload -> validated preview -> confirm. */
export function BulkUploadPanel({ onImported }: { onImported?: () => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<Result | null>(null);

  const valid = rows.filter((r) => r.value);
  const invalid = rows.filter((r) => !r.value);

  const importer = useMutation({
    mutationFn: () =>
      bulkImportStudents({ data: { rows: valid.map((r) => r.value!) } }),
    onSuccess: (data) => {
      setResults(data);
      setRows([]);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(`${data.filter((d) => d.status === "CREATED").length} student(s) imported`);
      onImported?.();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onFile(file?: File) {
    if (!file) return;
    try {
      const parsed = await parseUpload(file);
      if (parsed.length === 0) {
        toast.error("No data rows found in that file");
        return;
      }
      setFileName(file.name);
      setResults(null);
      setRows(parsed);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (results) return <BulkResultTable results={results} onDone={() => setResults(null)} />;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-foreground">1 · Download the template</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Fill it in outside the platform. Do not add a password column — the system generates one
          for every student and forces a reset on first login.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("csv")}>
            <Download className="size-4" /> CSV template
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("xlsx")}>
            <Download className="size-4" /> XLSX template
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-foreground">2 · Upload the filled file</p>
        <Input
          className="mt-3"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {fileName && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-4" /> {fileName} · {rows.length} row(s)
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            3 · Preview — {valid.length} ready, {invalid.length} with errors
          </p>

          {invalid.length > 0 && (
            <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="size-4" /> Rows that will be skipped
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {invalid.slice(0, 20).map((row) => (
                  <li key={row.index}>
                    Row {row.index}: {row.errors.join("; ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Programme</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {valid.map((row) => (
                  <tr key={row.index} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{row.index}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{row.value!.full_name}</td>
                    <td className="px-3 py-2">{row.value!.email}</td>
                    <td className="px-3 py-2">{row.value!.programme_code}</td>
                    <td className="px-3 py-2">{row.value!.phone}</td>
                    <td className="px-3 py-2">{row.value!.lead_source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            className="h-11 w-full"
            disabled={valid.length === 0 || importer.isPending}
            onClick={() => importer.mutate()}
          >
            {importer.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Confirm import of {valid.length} student(s)
          </Button>
        </div>
      )}
    </div>
  );
}
