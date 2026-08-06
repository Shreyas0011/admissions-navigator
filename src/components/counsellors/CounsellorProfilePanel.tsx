import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMyCounsellorFn,
  updateMyCounsellorFn,
} from "@/domains/counsellors/counsellors.functions";

/** A counsellor maintains their own directory record. */
export function CounsellorProfilePanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-counsellor"],
    queryFn: () => getMyCounsellorFn(),
  });

  const [form, setForm] = useState({ fullName: "", phone: "", maxActiveLeads: 50 });

  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.full_name,
        phone: data.phone ?? "",
        maxActiveLeads: data.max_active_leads,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateMyCounsellorFn({ data: form }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["my-counsellor"] });
      queryClient.invalidateQueries({ queryKey: ["counsellors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />;
  if (!data) return null;

  return (
    <section className="surface-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">My counsellor profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {data.email}. Keep your details current — the assignment engine uses your
        capacity.
      </p>

      <form
        className="mt-5 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="p-name">Full name</Label>
          <Input
            id="p-name"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-phone">Phone</Label>
          <Input
            id="p-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-max">Max active leads</Label>
          <Input
            id="p-max"
            type="number"
            min={1}
            value={form.maxActiveLeads}
            onChange={(e) => setForm({ ...form, maxActiveLeads: Number(e.target.value) })}
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save profile
          </Button>
        </div>
      </form>
    </section>
  );
}
