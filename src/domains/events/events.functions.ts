import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSeminars = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listSeminars } = await import("@/domains/events/events.server");
    return listSeminars();
  });

export const getExams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listExams } = await import("@/domains/events/events.server");
    return listExams();
  });
