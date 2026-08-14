import { z } from "zod";

export const groundPurposeSchema = z.enum(["SEMINAR", "EXAM"]);
export type GroundPurposeInput = z.infer<typeof groundPurposeSchema>;

export const todaySessionsSchema = z.object({
  purpose: groundPurposeSchema.default("SEMINAR"),
});

export const groundLoginSchema = z.object({
  sessionId: z.string().uuid(),
  staffName: z.string().trim().min(2, "Enter your name").max(80),
  password: z.string().trim().min(4, "Enter the session password").max(64),
  purpose: groundPurposeSchema.default("SEMINAR"),
});
export type GroundLoginInput = z.infer<typeof groundLoginSchema>;

export const groundTokenSchema = z.object({
  token: z.string().trim().min(16).max(600),
});

export const scanSchema = z.object({
  token: z.string().trim().min(16).max(600),
  payload: z.string().trim().min(6).max(400),
});

export const markAttendanceSchema = z.object({
  token: z.string().trim().min(16).max(600),
  studentId: z.string().uuid(),
  walkIn: z.boolean().default(false),
});

export const groundPasswordSchema = z.object({
  sessionId: z.string().uuid(),
  password: z.string().trim().min(4).max(64).optional(),
});
