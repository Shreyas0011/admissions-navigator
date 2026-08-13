import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  groundLoginSchema,
  groundPasswordSchema,
  groundTokenSchema,
  markAttendanceSchema,
  scanSchema,
} from "./schema";

/* ---------------- Ground staff (password session, no account) ---------------- */

export const listTodaySessionsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { listTodaySessions } = await import("./attendance.service");
  return listTodaySessions();
});

export const groundLoginFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => groundLoginSchema.parse(input))
  .handler(async ({ data }) => {
    const { groundLogin } = await import("./attendance.service");
    return groundLogin(data);
  });

export const groundBoardFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => groundTokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { groundBoard } = await import("./attendance.service");
    return groundBoard(data.token);
  });

export const groundScanFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scanSchema.parse(input))
  .handler(async ({ data }) => {
    const { scanStudent } = await import("./attendance.service");
    return scanStudent(data.payload, data.token);
  });

export const groundMarkAttendanceFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => markAttendanceSchema.parse(input))
  .handler(async ({ data }) => {
    const { markAttendance } = await import("./attendance.service");
    return markAttendance(data.studentId, data.token);
  });

/* ---------------- Admin ---------------- */

export const setGroundPasswordFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => groundPasswordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { setGroundPassword } = await import("./attendance.service");
    return setGroundPassword(data.sessionId, data.password);
  });

export const getSessionAttendanceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("@/domains/users/access.server");
    await requireStaff(context.supabase, context.userId);
    const { getSessionBoard } = await import("./attendance.service");
    return getSessionBoard(data.sessionId);
  });
