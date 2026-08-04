import { Link } from "@tanstack/react-router";

import { Progress } from "@/components/ui/progress";
import type { ProgrammeSummary } from "@/domains/programmes/programmes.service";

const STATUS_TONE: Record<string, string> = {
  OPEN: "bg-success-soft text-success",
  DRAFT: "bg-muted text-muted-foreground",
  CLOSED: "bg-warning-soft text-warning",
};

export function ProgrammeTable({ rows }: { rows: ProgrammeSummary[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted-foreground">
        No programmes yet. Create the first one to start accepting applications.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container text-left">
          <tr className="label-caps text-muted-foreground">
            <th className="px-6 py-4">Code</th>
            <th className="px-6 py-4">Programme</th>
            <th className="px-6 py-4">Department</th>
            <th className="px-6 py-4">Intake</th>
            <th className="px-6 py-4">Applications</th>
            <th className="px-6 py-4">Fill rate</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-surface-container/60">
              <td className="px-6 py-4 font-mono text-xs text-primary">
                <Link to="/programmes/$programmeId" params={{ programmeId: p.id }}>
                  {p.code}
                </Link>
              </td>
              <td className="px-6 py-4 font-medium text-foreground">
                <Link to="/programmes/$programmeId" params={{ programmeId: p.id }}>
                  {p.name}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {p.academic_years?.label ?? "No academic year"}
                </span>
              </td>
              <td className="px-6 py-4 text-muted-foreground">{p.department}</td>
              <td className="px-6 py-4 tabular-nums">{p.intake}</td>
              <td className="px-6 py-4 tabular-nums">{p.applications}</td>
              <td className="px-6 py-4">
                <Progress value={Math.min(p.fillRate, 100)} className="h-2 w-28" />
                <span className="mt-1 block text-xs text-muted-foreground">{p.fillRate}%</span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[p.status] ?? ""}`}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
