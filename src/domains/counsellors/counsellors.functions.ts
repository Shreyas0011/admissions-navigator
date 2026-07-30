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
