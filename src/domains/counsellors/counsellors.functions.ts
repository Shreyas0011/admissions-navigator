import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
