import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCounsellorAccountFn,
  listCounsellors,
} from "@/domains/counsellors/counsellors.functions";

const EMPTY = { fullName: "", email: "", password: "", phone: "", maxActiveLeads: 50 };

/** Admin-only panel: counsellors do not self-register, admins issue logins. */
export function CounsellorAccounts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: counsellors, isLoading } = useQuery({
    queryKey: ["counsellors"],
    queryFn: () => listCounsellors(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createCounsellorAccountFn({
        data: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          maxActiveLeads: Number(form.maxActiveLeads) || 50,
        },
      }),
    onSuccess: (result) => {
      toast.success(`Counsellor login created for ${result.email}`);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["counsellors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="surface-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Counsellor accounts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counsellors cannot sign themselves up. Create the login here — they then sign in at /auth
        with this email and password and land on My Leads.
      </p>

      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="c-name">Full name</Label>
          <Input
            id="c-name"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Meera Nair"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">Work email</Label>
          <Input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="meera@college.edu"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-password">Temporary password</Label>
          <Input
            id="c-password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-phone">Phone (optional)</Label>
          <Input
            id="c-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-max">Max active leads</Label>
          <Input
            id="c-max"
            type="number"
            min={1}
            value={form.maxActiveLeads}
            onChange={(e) => setForm({ ...form, maxActiveLeads: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 size-4" />
            )}
            Create counsellor login
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : (
          (counsellors ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-surface-low px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {c.active_leads}/{c.max_active_leads} active leads
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
