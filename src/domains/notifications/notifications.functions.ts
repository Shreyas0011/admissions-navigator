import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listEmailQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ status: z.enum(["QUEUED", "SENT", "FAILED", "CANCELLED"]).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { listEmails, emailCounts } = await import("@/domains/notifications/email.server");
    const [rows, counts] = await Promise.all([listEmails(data.status), emailCounts()]);
    return { rows, counts };
  });
