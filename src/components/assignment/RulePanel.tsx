import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteRuleFn, saveRuleFn } from "@/domains/assignment/assignment.functions";
import {
  ALGORITHMS,
  type EnginePolicy,
  type EnginePool,
  type EngineProgramme,
  type EngineRule,
} from "./types";

const ANY = "__any__";

export function RulePanel({
  rules,
  policies,
  pools,
  programmes,
}: {
  rules: EngineRule[];
  policies: EnginePolicy[];
  pools: EnginePool[];
  programmes: EngineProgramme[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["engine-console"] });

  const [policyId, setPolicyId] = useState(policies[0]?.id ?? "");
  const [programmeId, setProgrammeId] = useState(ANY);
  const [poolId, setPoolId] = useState(pools[0]?.id ?? "");
  const [algorithm, setAlgorithm] = useState("LEAST_WORKLOAD");
  const [priority, setPriority] = useState("10");

  const save = useMutation({
    mutationFn: () =>
      saveRuleFn({
        data: {
          policyId,
          programmeId: programmeId === ANY ? null : programmeId,
          poolId,
          algorithm: algorithm as never,
          priority: Number(priority),
        },
      }),
    onSuccess: () => {
      toast.success("Rule saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRuleFn({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground">New rule</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-5">
          <Picker label="Policy" value={policyId} onChange={setPolicyId}
            options={policies.map((p) => ({ value: p.id, label: p.name }))} />
          <Picker label="Programme" value={programmeId} onChange={setProgrammeId}
            options={[{ value: ANY, label: "Any programme" }, ...programmes.map((p) => ({ value: p.id, label: p.name }))]} />
          <Picker label="Pool" value={poolId} onChange={setPoolId}
            options={pools.map((p) => ({ value: p.id, label: p.name }))} />
          <Picker label="Algorithm" value={algorithm} onChange={setAlgorithm}
            options={ALGORITHMS.map((a) => ({ value: a, label: a.replace(/_/g, " ") }))} />
          <div>
            <Label className="mb-2 block">Priority</Label>
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" disabled={!policyId || !poolId || save.isPending} onClick={() => save.mutate()}>
          Add rule
        </Button>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-left">
            <tr className="label-caps text-muted-foreground">
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Programme</th>
              <th className="px-6 py-4">Pool</th>
              <th className="px-6 py-4">Algorithm</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  No rules yet — the policy's default pool and fallback algorithm apply.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-t border-border">
                  <td className="px-6 py-4 tabular-nums">{rule.priority}</td>
                  <td className="px-6 py-4 text-foreground">{rule.programmes?.name ?? "Any programme"}</td>
                  <td className="px-6 py-4">{rule.counsellor_pools?.name ?? "—"}</td>
                  <td className="px-6 py-4">{rule.algorithm.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(rule.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
