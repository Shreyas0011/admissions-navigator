import { z } from "zod";

export const leadSourceSchema = z.enum([
  "WEBSITE",
  "REFERRAL",
  "WALK_IN",
  "SOCIAL_MEDIA",
  "EDUCATION_FAIR",
  "SCHOOL_VISIT",
  "OTHER",
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

/** Module 1 — Public Inquiry Portal payload. */
export const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter the full name").max(120),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  school: z.string().trim().min(2, "School is required").max(160),
  course: z.string().trim().min(1, "Please choose a course").max(120),
  parentName: z.string().trim().min(2, "Parent or guardian name is required").max(120),
  parentPhone: z.string().trim().min(7, "Parent phone is required").max(24),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(24),
  leadSource: leadSourceSchema,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Module 2 — Students Registry query. */
export const registryQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  stage: admissionStageSchema.optional(),
  counsellorId: z.string().uuid().optional(),
  from: z.string().trim().max(40).optional(),
  to: z.string().trim().max(40).optional(),
  sortBy: z.enum(["created_at", "full_name", "student_code", "stage"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).max(5000).default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
});

export type RegistryQuery = z.infer<typeof registryQuerySchema>;

export const stageTransitionSchema = z.object({
  studentId: z.string().uuid(),
  toStage: admissionStageSchema,
  reason: z.string().trim().max(500).optional(),
});

/** Module 1b — public application that also provisions the student's login. */
export const applicationSchema = enquirySchema
  .extend({
    programmeId: z.string().uuid("Please choose a programme"),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const callLogSchema = z.object({
  studentId: z.string().uuid(),
  outcome: z.enum([
    "CONNECTED",
    "NO_ANSWER",
    "BUSY",
    "WRONG_NUMBER",
    "NOT_INTERESTED",
    "CALLBACK_REQUESTED",
  ]),
  notes: z.string().trim().max(1000).optional(),
  /** Local datetime string from the counsellor's form; defaults to now. */
  calledAt: z.string().trim().max(40).optional(),
});

export type CallLogInput = z.infer<typeof callLogSchema>;
