import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Identity + roles for the signed-in staff member, used to shape navigation. */
export const getCurrentActor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadActor } = await import("@/domains/users/access.server");
    return loadActor(context.supabase, context.userId);
  });
