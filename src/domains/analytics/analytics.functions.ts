import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPipelineOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { pipelineOverview, recentActivity } = await import(
      "@/domains/analytics/analytics.server"
    );
    const [overview, activity] = await Promise.all([pipelineOverview(), recentActivity()]);
    return { overview, activity };
  });
