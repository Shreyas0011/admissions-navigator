import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { listCounsellors } from "@/domains/counsellors/counsellors.functions";

/** Directory of counsellors; selecting one opens the admin drill-in. */
export function CounsellorList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["counsellors"],
    queryFn: () => listCounsellors(),
  });

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No counsellors yet"
        description="Create the first counsellor login above — they then appear in pools and auto-assignment."
      />
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-low text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Counsellor</th>
            <th className="px-5 py-3 font-medium">Contact</th>
            <th className="px-5 py-3 font-medium">Workload</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr
              key={c.id}
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
              className="cursor-pointer border-t border-border/60 transition-colors hover:bg-surface-low"
            >
              <td className="px-5 py-4 font-medium text-foreground">{c.full_name}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {c.email}
                {c.phone ? ` · ${c.phone}` : ""}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {c.active_leads}/{c.max_active_leads} active leads
              </td>
              <td className="px-5 py-4">
                <span
                  className={
                    c.is_active
                      ? "rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"
                      : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
