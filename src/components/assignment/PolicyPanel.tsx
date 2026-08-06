import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPolicyFn,
  publishPolicyFn,
  togglePolicyFn,
  updatePolicyFn,
} from "@/domains/assignment/assignment.functions";
import type { PolicyInput } from "@/domains/assignment/schema";
import { ALGORITHMS, POLICY_TYPES, type EnginePolicy, type EnginePool } from "./types";

export function PolicyPanel({
  policies,
  pools,
}: {
  policies: EnginePolicy[];
  pools: EnginePool[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["engine-console"] });
  const [name, setName] = useState("");
  const [policyType, setPolicyType] = useState<string>("PROGRAMME_BASED");
  const [algorithm, setAlgorithm] = useState<string>("LEAST_WORKLOAD");
  const [poolId, setPoolId] = useState<string>("");

  const create = useMutation({
    mutationFn: () =>
      createPolicyFn({
        data: {
          name,
          policyType: policyType as never,
          autoAssign: true,
          fallbackAlgorithm: algorithm as never,
          defaultPoolId: poolId || null,
          priority: 100,
        },
      }),
    onSuccess: () => {
      toast.success("Policy created");
      setName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (input: PolicyInput) => updatePolicyFn({ data: input }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; enabled: boolean }) => togglePolicyFn({ data: input }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: (input: { id: string; published: boolean }) => publishPolicyFn({ data: input }),
    onSuccess: (result) => {
      toast.success(
        result.published
          ? `Policy published — ${result.assigned} waiting application(s) auto-assigned`
          : "Policy unpublished",
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-6">
        <h3 className="text-base font-semibold text-foreground">New policy</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <Label className="mb-2 block">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Default 2026" />
          </div>
          <SelectField label="Type" value={policyType} onChange={setPolicyType} options={POLICY_TYPES} />
          <SelectField
            label="Fallback algorithm"
            value={algorithm}
            onChange={setAlgorithm}
            options={ALGORITHMS}
          />
          <div>
            <Label className="mb-2 block">Default pool</Label>
            <Select value={poolId} onValueChange={setPoolId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {pools.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={name.trim().length < 2 || create.isPending}
          onClick={() => create.mutate()}
        >
          Create policy
        </Button>
      </div>

      {policies.map((policy) => (
        <div key={policy.id} className="surface-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                {policy.name}
                {policy.is_published && (
                  <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                    Live
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Priority {policy.priority} · default pool {policy.counsellor_pools?.name ?? "none"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant={policy.is_published ? "outline" : "default"}
                disabled={publish.isPending}
                onClick={() =>
                  publish.mutate({ id: policy.id, published: !policy.is_published })
                }
              >
                {policy.is_published ? "Unpublish" : "Publish"}
              </Button>
              <label className="flex items-center gap-2 text-sm">
                Enabled
                <Switch
                  checked={policy.enabled}
                  onCheckedChange={(enabled) => toggle.mutate({ id: policy.id, enabled })}
                />
              </label>
            </div>
          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <SelectField
              label="Policy type"
              value={policy.policy_type}
              options={POLICY_TYPES}
              onChange={(v) =>
                update.mutate({
                  id: policy.id,
                  policyType: v as never,
                  autoAssign: policy.auto_assign,
                  fallbackAlgorithm: policy.fallback_algorithm as never,
                  defaultPoolId: policy.default_pool_id,
                })
              }
            />
            <SelectField
              label="Fallback algorithm"
              value={policy.fallback_algorithm}
              options={ALGORITHMS}
              onChange={(v) =>
                update.mutate({
                  id: policy.id,
                  policyType: policy.policy_type as never,
                  autoAssign: policy.auto_assign,
                  fallbackAlgorithm: v as never,
                  defaultPoolId: policy.default_pool_id,
                })
              }
            />
            <div>
              <Label className="mb-2 block">Default pool</Label>
              <Select
                value={policy.default_pool_id ?? undefined}
                onValueChange={(v) =>
                  update.mutate({
                    id: policy.id,
                    policyType: policy.policy_type as never,
                    autoAssign: policy.auto_assign,
                    fallbackAlgorithm: policy.fallback_algorithm as never,
                    defaultPoolId: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                Auto-assign
                <Switch
                  checked={policy.auto_assign}
                  onCheckedChange={(autoAssign) =>
                    update.mutate({
                      id: policy.id,
                      policyType: policy.policy_type as never,
                      autoAssign,
                      fallbackAlgorithm: policy.fallback_algorithm as never,
                      defaultPoolId: policy.default_pool_id,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
