import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  counsellorAccountSchema,
  counsellorProfileSchema,
  passwordResetSchema,
} from "@/domains/counsellors/schema";

export const listCounsellors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listCounsellorsWithWorkload } = await import(
      "@/domains/counsellors/counsellors.server"
    );
    return listCounsellorsWithWorkload();
  });

/** Counsellor portal — only the caller's own leads. */
export const listMyLeadsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMyLeads } = await import("@/domains/counsellors/leads.server");
    return listMyLeads(context.userId);
  });

/** Admin-only: provision a counsellor login (email + password only). */
export const createCounsellorAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => counsellorAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { createCounsellorAccount } = await import("@/domains/counsellors/accounts.server");
    return createCounsellorAccount(data);
  });

/** Admin drill-in: a counsellor with their students and call history. */
export const getCounsellorDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { getCounsellorDetail } = await import("@/domains/counsellors/detail.server");
    return getCounsellorDetail(data.id);
  });

/** The signed-in counsellor's own record, including the first-login flag. */
export const getMyCounsellorFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMyCounsellorProfile } = await import("@/domains/counsellors/profile.server");
    return getMyCounsellorProfile(context.userId);
  });

export const updateMyCounsellorFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => counsellorProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { updateMyCounsellorProfile } = await import("@/domains/counsellors/profile.server");
    return updateMyCounsellorProfile(context.userId, data);
  });

export const completeFirstLoginResetFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => passwordResetSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { completeFirstLoginReset } = await import("@/domains/counsellors/profile.server");
    return completeFirstLoginReset(context.userId);
  });
