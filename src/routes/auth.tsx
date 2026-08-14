import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { GraduationCap, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/config/constants";
import { getCurrentActor } from "@/domains/users/users.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Staff Sign In — Admissions OS" },
      {
        name: "description",
        content:
          "Secure sign in for admissions counsellors and administrators managing the student pipeline.",
      },
      { property: "og:title", content: "Staff Sign In — Admissions OS" },
      {
        property: "og:description",
        content: "Secure sign in for admissions counsellors and administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  if (!value) return "/dashboard";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

async function landingPath(fallback: string) {
  try {
    const actor = await getCurrentActor();
    if (actor.roles.length === 0) return "/portal";
    if (!actor.isAdmin && actor.roles.includes("counsellor")) return "/my-leads";
  } catch {
    return "/portal";
  }
  return fallback;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    const target = search.redirect ? safePath(search.redirect) : await landingPath("/dashboard");
    navigate({ to: target, replace: true });
  }

  async function handleGoogle() {
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    const target = search.redirect ? safePath(search.redirect) : await landingPath("/dashboard");
    navigate({ to: target, replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-6" />
          </span>
          <span className="text-xl font-bold text-sidebar-accent-foreground">{APP_NAME}</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-bold tracking-tight text-sidebar-accent-foreground">
            One pipeline from first enquiry to hall ticket.
          </h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/75">
            Track every lead through counselling, seminars and entrance exams — with a full audit
            trail on every stage change.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Authorised staff only. All activity is logged.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the credentials issued by your admissions administrator.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="h-11 w-full" onClick={handleGoogle}>
            Continue with Google
          </Button>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to="/seminar-day"
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-foreground hover:bg-surface-container"
            >
              <span>
                <span className="block font-medium">Seminar day mode</span>
                <span className="block text-xs text-muted-foreground">
                  Name + seminar password
                </span>
              </span>
              <ScanLine className="size-4 text-primary" />
            </Link>
            <Link
              to="/exam-day"
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-foreground hover:bg-surface-container"
            >
              <span>
                <span className="block font-medium">Exam day mode</span>
                <span className="block text-xs text-muted-foreground">
                  Name + exam password
                </span>
              </span>
              <ScanLine className="size-4 text-primary" />
            </Link>
          </div>


          <p className="mt-8 text-center text-sm text-muted-foreground">
            New student? Your account is created with your application.{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Apply & create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
