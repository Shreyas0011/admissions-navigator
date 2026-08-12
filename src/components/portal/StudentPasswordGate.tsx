import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

/**
 * Students created through the admin bulk import receive a generated password.
 * They cannot use the portal until they replace it.
 */
export function StudentPasswordGate({ children }: { children: React.ReactNode }) {
  const [mustReset, setMustReset] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMustReset(Boolean(data.user?.user_metadata?.["must_reset_password"]));
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_reset_password: false },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setMustReset(false);
  }

  if (mustReset === null || mustReset === false) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="surface-card rounded-2xl p-8">
        <KeyRound className="size-8 text-primary" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Set your own password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account was created by the admissions office with a temporary password. Choose a new
          one to open your portal.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="sp-password">New password</Label>
            <Input
              id="sp-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-confirm">Confirm password</Label>
            <Input
              id="sp-confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save new password
          </Button>
        </form>
      </div>
    </div>
  );
}
