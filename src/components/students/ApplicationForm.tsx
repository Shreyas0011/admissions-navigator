import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_SOURCES } from "@/config/constants";
import { applicationSchema, type ApplicationInput } from "@/domains/students/schema";
import { submitApplication } from "@/domains/students/students.functions";
import { listOpenProgrammesFn } from "@/domains/programmes/programmes.functions";
import { supabase } from "@/integrations/supabase/client";

export function ApplicationForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);

  const { data: programmes } = useQuery({
    queryKey: ["open-programmes"],
    queryFn: () => listOpenProgrammesFn(),
  });

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      school: "",
      course: "",
      dateOfBirth: "",
      leadSource: "WEBSITE",
      programmeId: undefined as unknown as string,
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ApplicationInput) => {
      const result = await submitApplication({ data: values });
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      if (error)
        throw new Error(`${result.studentCode} created, but sign-in failed: ${error.message}`);
      return result;
    },
    onSuccess: (result) => {
      setCode(result.studentCode);
      toast.success(`Application ${result.studentCode} submitted`);
      setTimeout(() => navigate({ to: "/portal" }), 1200);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const errors = form.formState.errors;
  const errorCount = Object.keys(errors).length;

  if (code) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success-soft px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">Application received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reference is <span className="font-mono font-semibold text-foreground">{code}</span>.
          Taking you to your student portal…
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="grid gap-5 sm:grid-cols-2"
      noValidate
    >
      {(errorCount > 0 || mutation.isError) && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:col-span-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {mutation.isError
              ? (mutation.error as Error).message
              : `Please fix ${errorCount} field${errorCount > 1 ? "s" : ""} below before submitting.`}
          </span>
        </div>
      )}

      <Field id="programmeId" label="Programme you are applying to" error={errors.programmeId?.message} full>
        <Select
          onValueChange={(v) => {
            form.setValue("programmeId", v, { shouldValidate: true });
            const p = (programmes ?? []).find((x) => x.id === v);
            form.setValue("course", p ? `${p.code} — ${p.name}` : "", { shouldValidate: true });
          }}
        >
          <SelectTrigger id="programmeId">
            <SelectValue placeholder="Select a programme" />
          </SelectTrigger>
          <SelectContent>
            {(programmes ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.code} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(programmes ?? []).length === 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            No programmes are currently accepting applications.
          </p>
        )}
      </Field>

      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input id="fullName" {...form.register("fullName")} placeholder="Aarav Sharma" />
      </Field>
      <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth?.message}>
        <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
      </Field>
      <Field id="email" label="Email (your login)" error={errors.email?.message}>
        <Input id="email" type="email" {...form.register("email")} placeholder="student@email.com" />
      </Field>
      <Field id="phone" label="Phone" error={errors.phone?.message}>
        <Input id="phone" {...form.register("phone")} placeholder="+91 98765 43210" />
      </Field>
      <Field id="password" label="Password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
      </Field>
      <Field id="parentName" label="Parent / guardian name" error={errors.parentName?.message}>
        <Input id="parentName" {...form.register("parentName")} placeholder="Priya Sharma" />
      </Field>
      <Field id="parentPhone" label="Parent / guardian phone" error={errors.parentPhone?.message}>
        <Input id="parentPhone" {...form.register("parentPhone")} placeholder="+91 90000 00000" />
      </Field>
      <Field id="school" label="Current school" error={errors.school?.message}>
        <Input id="school" {...form.register("school")} placeholder="Delhi Public School" />
      </Field>
      <Field id="leadSource" label="How did you hear about us?" error={errors.leadSource?.message}>
        <Select
          defaultValue="WEBSITE"
          onValueChange={(v) => form.setValue("leadSource", v as ApplicationInput["leadSource"])}
        >
          <SelectTrigger id="leadSource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Button type="submit" className="h-12 w-full text-base" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit application &amp; create account
        </Button>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Already applied?{" "}
          <Link to="/student-login" className="font-medium text-primary hover:underline">
            Sign in to your student portal
          </Link>
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
  full,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
