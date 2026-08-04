import { z } from "zod";

export const eventTypeSchema = z.enum(["WOC", "ACC", "EXAM", "OTHER"]);

export const allocationStrategySchema = z.enum([
  "FIRST_AVAILABLE",
  "LEAST_FILLED",
  "ROUND_ROBIN",
  "MANUAL",
]);

export const admissionStageSchema = z.enum([
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "WOC_BOOKED",
  "WOC_ATTENDED",
  "ACC_BOOKED",
  "ACC_ATTENDED",
  "EXAM_BOOKED",
  "HALL_TICKET_GENERATED",
]);

export const eventInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Title is required").max(160),
  eventType: eventTypeSchema,
  programmeId: z.string().uuid().nullable().default(null),
  subject: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  allocationStrategy: allocationStrategySchema.default("LEAST_FILLED"),
  targetStage: admissionStageSchema.nullable().default(null),
  registrationOpensAt: z.string().trim().max(40).optional(),
  registrationClosesAt: z.string().trim().max(40).optional(),
  autoApprove: z.boolean().default(true),
  allowCancellation: z.boolean().default(true),
  cancellationCutoffHours: z.coerce.number().int().min(0).max(720).default(24),
  isOpen: z.boolean().default(false),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const sessionInputSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  venueId: z.string().uuid().nullable().default(null),
  startsAt: z.string().trim().min(1, "Start time is required"),
  endsAt: z.string().trim().min(1, "End time is required"),
  capacity: z.coerce.number().int().min(1).max(5000),
  reservedSeats: z.coerce.number().int().min(0).max(5000).default(0),
  waitlistEnabled: z.boolean().default(false),
  waitlistSize: z.coerce.number().int().min(0).max(1000).default(0),
  isOpen: z.boolean().default(true),
});

export type SessionInput = z.infer<typeof sessionInputSchema>;

export const bookingInputSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;
