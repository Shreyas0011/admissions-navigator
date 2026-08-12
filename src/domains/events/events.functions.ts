import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { bookingInputSchema, eventInputSchema, sessionInputSchema } from "./schema";

const idSchema = z.object({ id: z.string().uuid() });

export const listEventsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { listEvents } = await import("./events.service");
    return listEvents();
  });

export const getEventFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { getEventDetail } = await import("./events.service");
    return getEventDetail(data.id);
  });

export const saveEventFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => eventInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveEvent } = await import("./events.service");
    return saveEvent(data);
  });

export const saveSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sessionInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveSession } = await import("./events.service");
    await saveSession(data);
    return { ok: true };
  });

export const publishEventFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), isOpen: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { publishEvent } = await import("./events.service");
    await publishEvent(data.id, data.isOpen);
    return { ok: true };
  });

export const bookSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    bookingInputSchema.extend({ studentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/domains/users/access.server");
    const actor = await requireStaff(context.supabase, context.userId);
    const { bookSession } = await import("./events.service");
    return bookSession({
      sessionId: data.sessionId,
      studentId: data.studentId,
      actorId: context.userId,
      actorLabel: actor.label,
    });
  });

export const autoAllocateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    const actor = await requireAdmin(context.supabase, context.userId);
    const { autoAllocate } = await import("./allocation.service");
    return autoAllocate({ eventId: data.id, actorId: context.userId, actorLabel: actor.label });
  });

export const getExams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { listExams } = await import("./events.server");
    return listExams();
  });
