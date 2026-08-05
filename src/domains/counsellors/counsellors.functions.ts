import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { counsellorAccountSchema } from "@/domains/counsellors/schema";

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

/** Admin-only: provision a counsellor login + directory record. */
export const createCounsellorAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => counsellorAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { createCounsellorAccount } = await import("@/domains/counsellors/accounts.server");
    return createCounsellorAccount(data);
  });
