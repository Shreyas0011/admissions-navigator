import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePoolFn } from "@/domains/assignment/assignment.functions";
import { ALGORITHMS, type EngineCounsellor, type EnginePool } from "./types";

export function PoolPanel({
  pools,
  counsellors,
}: {
  pools: EnginePool[];
  counsellors: EngineCounsellor[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [algorithm, setAlgorithm] = useState("LEAST_WORKLOAD");
  const [members, setMembers] = useState<string[]>([]);

  const save = useMutation({
    mutationFn: (input: { id?: string; name: string; defaultAlgorithm: string; memberIds: string[] }) =>
      savePoolFn({
        data: {
          id: input.id,
          name: input.name,
          defaultAlgorithm: input.defaultAlgorithm as never,
          memberIds: input.memberIds,
        },
      }),
    onSuccess: () => {
      toast.success("Pool saved");
      setName("");
      setMembers([]);
      queryClient.invalidateQueries({ queryKey: ["engine-console"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleMember(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground">New pool</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Pool name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Engineering pool" />
          </div>
          <div>
            <Label className="mb-2 block">Default algorithm</Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALGORITHMS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {counsellors.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <Checkbox
                checked={members.includes(c.id)}
                onCheckedChange={() => setMembers((prev) => toggleMember(prev, c.id))}
              />
              {c.full_name}
              <span className="text-xs text-muted-foreground">{c.active_leads} active</span>
            </label>
          ))}
        </div>
        <Button
          className="mt-4"
          disabled={name.trim().length < 2 || save.isPending}
          onClick={() => save.mutate({ name, defaultAlgorithm: algorithm, memberIds: members })}
        >
          Create pool
        </Button>
      </div>

      {pools.map((pool) => (
        <div key={pool.id} className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{pool.name}</h3>
              <p className="text-xs text-muted-foreground">
                {pool.default_algorithm.replace(/_/g, " ")} · {pool.memberIds.length} members
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {counsellors.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                <Checkbox
                  checked={pool.memberIds.includes(c.id)}
                  onCheckedChange={() =>
                    save.mutate({
                      id: pool.id,
                      name: pool.name,
                      defaultAlgorithm: pool.default_algorithm,
                      memberIds: toggleMember(pool.memberIds, c.id),
                    })
                  }
                />
                {c.full_name}
                <span className="text-xs text-muted-foreground">
                  {c.active_leads}/{c.max_active_leads}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
