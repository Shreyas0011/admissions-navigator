import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student-login")({
  head: () => ({
    meta: [
      { title: "Student Sign In — Admissions OS" },
      {
        name: "description",
        content:
          "Applicants sign in with the email and password used on the application form to track their admission.",
      },
      { property: "og:title", content: "Student Sign In — Admissions OS" },
      {
        property: "og:description",
        content: "Track your application, counsellor and seminar bookings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/portal", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <div className="surface-card w-full max-w-md rounded-2xl p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Student sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email and password you set on your application form.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <Label htmlFor="student-email" className="mb-2 block">
              Email
            </Label>
            <Input
              id="student-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
            />
          </div>
          <div>
            <Label htmlFor="student-password" className="mb-2 block">
              Password
            </Label>
            <Input
              id="student-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign in to my portal
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Haven&apos;t applied yet?{" "}
          <Link to="/" className="font-medium text-primary hover:underline">
            Start your application
          </Link>
        </p>
      </div>
    </div>
  );
}
