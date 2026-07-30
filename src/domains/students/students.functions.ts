import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  enquirySchema,
  registryQuerySchema,
  stageTransitionSchema,
} from "@/domains/students/schema";
import { z } from "zod";

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => enquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { createEnquiry } = await import("@/domains/students/students.server");
    return createEnquiry(data);
  });

export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => registryQuerySchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { queryRegistry } = await import("@/domains/students/students.server");
    return queryRegistry(data);
  });

export const getStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getStudentById, getStudentTimeline } = await import(
      "@/domains/students/students.server"
    );
    const [student, timeline] = await Promise.all([
      getStudentById(data.id),
      getStudentTimeline(data.id),
    ]);
    return { student, timeline };
  });

export const moveStudentStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => stageTransitionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { transitionStage } = await import("@/domains/students/students.server");
    const { requireStaff } = await import("@/domains/users/access.server");
    const actor = await requireStaff(context.supabase, context.userId);
    return transitionStage({
      studentId: data.studentId,
      toStage: data.toStage,
      actorId: context.userId,
      actorLabel: actor.label,
      reason: data.reason,
    });
  });

export const assignStudentCounsellor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ studentId: z.string().uuid(), counsellorId: z.string().uuid().nullable() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assignCounsellor } = await import("@/domains/students/students.server");
    const { requireAdmin } = await import("@/domains/users/access.server");
    const actor = await requireAdmin(context.supabase, context.userId);
    return assignCounsellor({
      studentId: data.studentId,
      counsellorId: data.counsellorId,
      actorId: context.userId,
      actorLabel: actor.label,
    });
  });
