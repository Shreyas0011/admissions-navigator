import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyApplicationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMyApplication } = await import("./portal.service");
    return getMyApplication(context.userId);
  });

export const listMySessionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMySessions } = await import("./portal.service");
    return listMySessions(context.userId);
  });

export const registerForSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { registerForSession } = await import("./portal.service");
    return registerForSession(context.userId, data.sessionId);
  });

export const cancelMyBookingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ bookingId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { cancelMyBooking } = await import("./portal.service");
    return cancelMyBooking(context.userId, data.bookingId);
  });
