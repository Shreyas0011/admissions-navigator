import { Mail, Phone, MoreHorizontal } from "lucide-react";

import { StageBadge } from "@/components/shared/StageBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudentRow } from "@/domains/students/students.server";
import { Users } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_TONES = [
  "bg-primary-soft text-primary",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-info-soft text-info",
];

export function StudentTable({
  rows,
  loading,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  rows: StudentRow[];
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (row: StudentRow) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" />}
        title="No students match these filters"
        description="Try clearing the search term or widening the stage filter."
      />
    );
  }

  const allSelected = rows.every((r) => selected.includes(r.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface-low">
            <th className="w-12 px-6 py-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label="Select all students on this page"
              />
            </th>
            {["Student ID", "Details", "Parent / Guardian", "Contact Info", "Admission Stage", "Counsellor", ""].map(
              (label, i) => (
                <th
                  key={i}
                  className="label-caps px-4 py-3 text-muted-foreground whitespace-nowrap"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              onClick={() => onOpen(row)}
              className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-surface-low"
            >
              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.includes(row.id)}
                  onCheckedChange={() => onToggle(row.id)}
                  aria-label={`Select ${row.full_name}`}
                />
              </td>

              <td className="px-4 py-4 font-mono text-sm font-medium text-primary whitespace-nowrap">
                {row.student_code}
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      AVATAR_TONES[index % AVATAR_TONES.length]
                    }`}
                  >
                    {initials(row.full_name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {row.full_name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.course ?? "Course undecided"}
                      {row.school ? ` · ${row.school}` : ""}
                    </span>
                  </span>
                </div>
              </td>

              <td className="px-4 py-4">
                <span className="block text-sm text-foreground">{row.parent_name ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">
                  {row.parent_phone ?? "No parent contact"}
                </span>
              </td>

              <td className="px-4 py-4">
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <Phone className="size-3.5 text-muted-foreground" />
                  {row.phone}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span className="max-w-[190px] truncate">{row.email}</span>
                </span>
              </td>

              <td className="px-4 py-4">
                <StageBadge stage={row.stage} />
              </td>

              <td className="px-4 py-4 text-sm whitespace-nowrap">
                {row.counsellor_name ? (
                  <span className="text-foreground">{row.counsellor_name}</span>
                ) : (
                  <span className="text-warning">Unassigned</span>
                )}
              </td>

              <td className="px-4 py-4">
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
