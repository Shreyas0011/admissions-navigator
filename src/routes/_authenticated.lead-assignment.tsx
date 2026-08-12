import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyPanel } from "@/components/assignment/PolicyPanel";
import { PoolPanel } from "@/components/assignment/PoolPanel";
import { RulePanel } from "@/components/assignment/RulePanel";
import { AssignmentLog } from "@/components/assignment/AssignmentLog";
import { getEngineConsoleFn, runEngineQueueFn } from "@/domains/assignment/assignment.functions";
import { AdminOnly } from "@/components/shared/AdminOnly";

export const Route = createFileRoute("/_authenticated/lead-assignment")({
  head: () => ({
    meta: [
      { title: "Assignment Engine — Admissions OS" },
      {
        name: "description",
        content: "Configure policies, counsellor pools and programme rules that distribute every lead.",
      },
    ],
  }),
  component: GuardedAssignmentEnginePage,
});

function AssignmentEnginePage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["engine-console"],
    queryFn: () => getEngineConsoleFn(),
  });

  const runQueue = useMutation({
    mutationFn: () => runEngineQueueFn(),
    onSuccess: (result) => {
      toast.success(`Assigned ${result.assigned} of ${result.considered} unassigned leads`);
      queryClient.invalidateQueries({ queryKey: ["engine-console"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Engine"
        title="Lead Assignment"
        description="Rules resolve programme → pool → algorithm. Every decision is written to an immutable audit trail."
        actions={
          <>
            <StatCard label="Unassigned" value={data?.queueSize ?? 0} accent />
            <StatCard label="Pools" value={data?.pools.length ?? 0} />
            <Button
              className="h-auto rounded-2xl px-6"
              disabled={runQueue.isPending}
              onClick={() => runQueue.mutate()}
            >
              <Wand2 className="size-4" /> Run engine on queue
            </Button>
          </>
        }
      />

      {isLoading || !data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <Tabs defaultValue="policies">
          <TabsList>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="pools">Pools</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="log">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="mt-6">
            <PolicyPanel policies={data.policies} pools={data.pools} />
          </TabsContent>
          <TabsContent value="pools" className="mt-6">
            <PoolPanel pools={data.pools} counsellors={data.counsellors} />
          </TabsContent>
          <TabsContent value="rules" className="mt-6">
            <RulePanel
              rules={data.rules}
              policies={data.policies}
              pools={data.pools}
              programmes={data.programmes}
            />
          </TabsContent>
          <TabsContent value="log" className="mt-6">
            <AssignmentLog rows={data.log} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function GuardedAssignmentEnginePage() {
  return (
    <AdminOnly>
      <AssignmentEnginePage />
    </AdminOnly>
  );
}
