import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  applicationSchema,
  callLogSchema,
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
  .handler(async ({ data, context }) => {
    const { studentScope } = await import("@/domains/users/access.server");
    const { counsellorId } = await studentScope(context.supabase, context.userId);
    const { queryRegistry } = await import("@/domains/students/students.server");
    // A counsellor may only ever read their own allocated students.
    return queryRegistry(counsellorId ? { ...data, counsellorId } : data);
  });

export const getStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertStudentVisible } = await import("@/domains/users/access.server");
    await assertStudentVisible(context.supabase, context.userId, data.id);
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
    const { requireStaff, assertStudentVisible } = await import("@/domains/users/access.server");
    const actor = await requireStaff(context.supabase, context.userId);
    await assertStudentVisible(context.supabase, context.userId, data.studentId);
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

/** Public: application + account creation in one call. */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    const { createApplicationAccount } = await import("@/domains/students/applications.server");
    return createApplicationAccount(data);
  });

export const getStudentDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertStudentVisible } = await import("@/domains/users/access.server");
    await assertStudentVisible(context.supabase, context.userId, data.id);
    const { getStudentDetail } = await import("@/domains/students/detail.server");
    return getStudentDetail(data.id);
  });

export const logStudentCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => callLogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireStaff, assertStudentVisible } = await import("@/domains/users/access.server");
    await requireStaff(context.supabase, context.userId);
    await assertStudentVisible(context.supabase, context.userId, data.studentId);
    const { logCall } = await import("@/domains/counsellors/leads.server");
    return logCall(context.userId, data);
  });

/** Admin-only: create many students from a validated spreadsheet upload. */
export const bulkImportStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(async (input: unknown) => {
    const { bulkImportSchema } = await import("@/domains/students/bulk.schema");
    return bulkImportSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { importStudents } = await import("@/domains/students/bulk.server");
    return importStudents(data.rows);
  });
