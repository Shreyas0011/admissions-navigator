import type { EngineLogRow } from "./types";
import { formatDateTime } from "@/lib/datetime";

export function AssignmentLog({ rows }: { rows: EngineLogRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="surface-card rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground">
        No assignments have been made yet.
      </p>
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-left">
          <tr className="label-caps text-muted-foreground">
            <th className="px-6 py-4">When</th>
            <th className="px-6 py-4">Student</th>
            <th className="px-6 py-4">Counsellor</th>
            <th className="px-6 py-4">Algorithm</th>
            <th className="px-6 py-4">Rule</th>
            <th className="px-6 py-4">Source</th>
            <th className="px-6 py-4">Candidates</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border align-top">
              <td className="px-6 py-4 text-muted-foreground">
                {formatDateTime(row.created_at)}
              </td>
              <td className="px-6 py-4 text-foreground">
                {row.students?.full_name ?? "—"}
                <span className="block font-mono text-xs text-primary">
                  {row.students?.student_code}
                </span>
              </td>
              <td className="px-6 py-4">{row.counsellors?.full_name ?? "No match"}</td>
              <td className="px-6 py-4">{row.algorithm?.replace(/_/g, " ") ?? "—"}</td>
              <td className="px-6 py-4 text-muted-foreground">{row.rule_label ?? "—"}</td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-surface-container px-2 py-1 text-xs">
                  {row.source}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-muted-foreground">
                {(row.candidates ?? [])
                  .map((c) => `${c.name} (${c.activeLeads})`)
                  .join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
