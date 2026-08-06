import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeFirstLoginResetFn,
  getMyCounsellorFn,
} from "@/domains/counsellors/counsellors.functions";

/**
 * Blocks the staff shell until a newly provisioned counsellor replaces the
 * temporary password the admin issued.
 */
export function FirstLoginGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-counsellor"],
    queryFn: () => getMyCounsellorFn(),
  });

  const mutation = useMutation({
    mutationFn: () => completeFirstLoginResetFn({ data: { password, confirmPassword } }),
    onSuccess: () => {
      toast.success("Password updated — welcome aboard");
      queryClient.invalidateQueries({ queryKey: ["my-counsellor"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data?.must_reset_password) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="surface-card rounded-2xl p-8">
        <KeyRound className="size-8 text-primary" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Set your own password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You signed in with the temporary password issued by your admin. Choose a new one to
          continue to your leads.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="r-password">New password</Label>
            <Input
              id="r-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-confirm">Confirm password</Label>
            <Input
              id="r-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save new password
          </Button>
        </form>
      </div>
    </div>
  );
}
