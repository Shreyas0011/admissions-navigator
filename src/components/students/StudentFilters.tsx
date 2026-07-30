import { Search, SlidersHorizontal, Download, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGES } from "@/config/constants";
import type { AdmissionStage } from "@/domains/admissions/types";

export type RegistryFilters = {
  search: string;
  stage: AdmissionStage | "ALL";
  counsellorId: string | "ALL";
};

export function StudentFilters({
  filters,
  counsellors,
  onChange,
  onExport,
}: {
  filters: RegistryFilters;
  counsellors: { id: string; full_name: string }[];
  onChange: (next: Partial<RegistryFilters>) => void;
  onExport: () => void;
}) {
  const dirty =
    filters.search !== "" || filters.stage !== "ALL" || filters.counsellorId !== "ALL";

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search by name, student ID, email or phone"
          className="h-10 rounded-xl bg-surface-low pl-10"
          aria-label="Search students"
        />
      </div>

      <Select
        value={filters.stage}
        onValueChange={(value) => onChange({ stage: value as RegistryFilters["stage"] })}
      >
        <SelectTrigger className="h-10 w-[190px] rounded-xl bg-surface-low">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <SelectValue placeholder="All stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All stages</SelectItem>
          {STAGES.map((stage) => (
            <SelectItem key={stage.value} value={stage.value}>
              {stage.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.counsellorId}
        onValueChange={(value) => onChange({ counsellorId: value })}
      >
        <SelectTrigger className="h-10 w-[190px] rounded-xl bg-surface-low">
          <SelectValue placeholder="All counsellors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All counsellors</SelectItem>
          {counsellors.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {dirty && (
        <Button
          variant="ghost"
          className="h-10 rounded-xl"
          onClick={() => onChange({ search: "", stage: "ALL", counsellorId: "ALL" })}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}

      <Button variant="outline" className="ml-auto h-10 rounded-xl" onClick={onExport}>
        <Download className="size-4" />
        Export CSV
      </Button>
    </div>
  );
}
