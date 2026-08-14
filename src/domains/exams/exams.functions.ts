import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const examConfigSchema = z.object({
  eventId: z.string().uuid(),
  durationMinutes: z.coerce.number().int().min(15).max(600),
  instructions: z.string().trim().max(1200).default(""),
});

export const listExamEventsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { listExamEvents } = await import("./exams.service");
    return listExamEvents();
  });

export const saveExamConfigFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => examConfigSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveExamConfig } = await import("./exams.service");
    return saveExamConfig(data);
  });

export const registerForExamFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { registerForExam } = await import("./exams.service");
    return registerForExam(context.userId, data.sessionId);
  });

export const getHallTicketFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ bookingId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { getHallTicket } = await import("./exams.service");
    return getHallTicket(context.userId, data.bookingId);
  });
