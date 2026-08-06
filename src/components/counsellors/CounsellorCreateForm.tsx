import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCounsellorAccountFn } from "@/domains/counsellors/counsellors.functions";

const EMPTY = { email: "", password: "" };

/** Admins issue counsellor logins with email + password only. */
export function CounsellorCreateForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const mutation = useMutation({
    mutationFn: () => createCounsellorAccountFn({ data: form }),
    onSuccess: (result) => {
      toast.success(`Counsellor login created for ${result.email}`);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["counsellors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="surface-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground">Create a counsellor login</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counsellors cannot self-register. Share these credentials — on first sign-in they must set
        their own password and complete their profile.
      </p>

      <form
        className="mt-5 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
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
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 size-4" />
            )}
            Create login
          </Button>
        </div>
      </form>
    </section>
  );
}
