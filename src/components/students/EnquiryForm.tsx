import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { COURSE_OPTIONS, LEAD_SOURCES } from "@/config/constants";
import { enquirySchema, type EnquiryInput } from "@/domains/students/schema";
import { submitEnquiry } from "@/domains/students/students.functions";

export function EnquiryForm({
  defaultSource = "WEBSITE",
  onSuccess,
}: {
  defaultSource?: EnquiryInput["leadSource"];
  onSuccess?: (studentCode: string) => void;
}) {
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const form = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      school: "",
      course: "",
      dateOfBirth: "",
      leadSource: defaultSource,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: EnquiryInput) => submitEnquiry({ data: values }),
    onSuccess: (result) => {
      setCreatedCode(result.studentCode);
      form.reset();
      toast.success(`Enquiry recorded as ${result.studentCode}`);
      onSuccess?.(result.studentCode);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const errors = form.formState.errors;

  if (createdCode) {
    return (
      <div className="rounded-2xl border border-success/25 bg-success-soft px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">Enquiry received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reference number is{" "}
          <span className="font-mono font-semibold text-foreground">{createdCode}</span>. A
          counsellor will reach out shortly and a confirmation email is on its way.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setCreatedCode(null)}>
          Submit another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="grid gap-5 sm:grid-cols-2"
    >
      <FormField label="Student full name" error={errors.fullName?.message} className="sm:col-span-2">
        <Input {...form.register("fullName")} placeholder="Aarav Sharma" />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" {...form.register("email")} placeholder="student@email.com" />
      </FormField>

      <FormField label="Phone" error={errors.phone?.message}>
        <Input {...form.register("phone")} placeholder="+91 98765 43210" />
      </FormField>

      <FormField label="Parent / guardian name" error={errors.parentName?.message}>
        <Input {...form.register("parentName")} placeholder="Optional" />
      </FormField>

      <FormField label="Parent / guardian phone" error={errors.parentPhone?.message}>
        <Input {...form.register("parentPhone")} placeholder="Optional" />
      </FormField>

      <FormField label="Current school" error={errors.school?.message}>
        <Input {...form.register("school")} placeholder="Optional" />
      </FormField>

      <FormField label="Date of birth" error={errors.dateOfBirth?.message}>
        <Input type="date" {...form.register("dateOfBirth")} />
      </FormField>

      <FormField label="Course of interest" error={errors.course?.message}>
        <Select onValueChange={(v) => form.setValue("course", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_OPTIONS.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="How did you hear about us?" error={errors.leadSource?.message}>
        <Select
          defaultValue={defaultSource}
          onValueChange={(v) => form.setValue("leadSource", v as EnquiryInput["leadSource"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="sm:col-span-2">
        <Button type="submit" className="h-12 w-full text-base" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit enquiry
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
