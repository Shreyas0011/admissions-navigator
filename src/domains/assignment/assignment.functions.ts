import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { policyCreateSchema, policyInputSchema, poolInputSchema, ruleInputSchema } from "./schema";

export const getEngineConsoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { getEngineConsole } = await import("./console.service");
    return getEngineConsole();
  });

export const createPolicyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => policyCreateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { insertPolicy } = await import("./policies.repo");
    return insertPolicy(data);
  });

export const updatePolicyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => policyInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { updatePolicy } = await import("./assignment.repo");
    await updatePolicy(data);
    return { ok: true };
  });

export const togglePolicyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { setPolicyEnabled } = await import("./policies.repo");
    await setPolicyEnabled(data.id, data.enabled);
    return { ok: true };
  });

export const savePoolFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => poolInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { savePoolRow } = await import("./assignment.repo");
    return savePoolRow(data);
  });

export const saveRuleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ruleInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveRuleRow } = await import("./assignment.repo");
    await saveRuleRow(data);
    return { ok: true };
  });

export const deleteRuleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { deleteRuleRow } = await import("./assignment.repo");
    await deleteRuleRow(data.id);
    return { ok: true };
  });

/** Run the engine for one student (manual trigger from the student drawer). */
export const runAssignmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/domains/users/access.server");
    const actor = await requireStaff(context.supabase, context.userId);
    const { resolveAssignment } = await import("./assignment.service");
    return resolveAssignment({
      studentId: data.studentId,
      actorId: context.userId,
      actorLabel: actor.label,
      force: true,
    });
  });

export const runEngineQueueFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    const actor = await requireAdmin(context.supabase, context.userId);
    const { runEngineOnQueue } = await import("./assignment.service");
    return runEngineOnQueue({ actorId: context.userId, actorLabel: actor.label });
  });
