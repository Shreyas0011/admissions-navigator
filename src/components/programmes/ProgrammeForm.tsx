import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programmeInputSchema, type ProgrammeInput } from "@/domains/programmes/schema";
import { listAcademicYearsFn, saveProgrammeFn } from "@/domains/programmes/programmes.functions";

export function ProgrammeForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();

  const { data: years } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => listAcademicYearsFn(),
  });

  const form = useForm<z.input<typeof programmeInputSchema>, unknown, ProgrammeInput>({
    resolver: zodResolver(programmeInputSchema),
    defaultValues: {
      code: "",
      name: "",
      department: "",
      intake: 60,
      duration: "",
      description: "",
      status: "OPEN",
      academicYearId: null,
      applicationsOpenAt: "",
      applicationsCloseAt: "",
    },
  });

  const save = useMutation({
    mutationFn: (values: ProgrammeInput) => saveProgrammeFn({ data: values }),
    onSuccess: () => {
      toast.success("Programme saved");
      queryClient.invalidateQueries({ queryKey: ["programmes"] });
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const e = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="grid gap-5 sm:grid-cols-2"
    >
      <Field label="Programme code" error={e.code?.message}>
        <Input {...form.register("code")} placeholder="BTCSE-2026" />
      </Field>
      <Field label="Programme name" error={e.name?.message}>
        <Input {...form.register("name")} placeholder="B.Tech Computer Science" />
      </Field>
      <Field label="Department" error={e.department?.message}>
        <Input {...form.register("department")} placeholder="Engineering" />
      </Field>
      <Field label="Intake" error={e.intake?.message}>
        <Input type="number" {...form.register("intake")} />
      </Field>
      <Field label="Academic year" error={e.academicYearId?.message}>
        <Select onValueChange={(v) => form.setValue("academicYearId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {(years ?? []).map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration" error={e.duration?.message}>
        <Input {...form.register("duration")} placeholder="4 years" />
      </Field>
      <Field label="Applications open" error={e.applicationsOpenAt?.message}>
        <DateTimeField
          value={form.watch("applicationsOpenAt") ?? ""}
          onChange={(v) => form.setValue("applicationsOpenAt", v)}
        />
      </Field>
      <Field label="Applications close" error={e.applicationsCloseAt?.message}>
        <DateTimeField
          value={form.watch("applicationsCloseAt") ?? ""}
          onChange={(v) => form.setValue("applicationsCloseAt", v)}
        />
      </Field>
      <Field label="Status" error={e.status?.message}>
        <Select
          defaultValue="OPEN"
          onValueChange={(v) => form.setValue("status", v as ProgrammeInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["DRAFT", "OPEN", "CLOSED"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Description" error={e.description?.message} full>
        <Textarea rows={3} {...form.register("description")} />
      </Field>

      <div className="sm:col-span-2">
        <Button type="submit" className="h-11 w-full" disabled={save.isPending}>
          {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save programme
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  full,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
