import { z } from "zod";

import { leadSourceSchema } from "./schema";

/**
 * Bulk import — the exact shape of the downloadable template.
 * No password column: the system generates one per student.
 */
export const BULK_COLUMNS = [
  "full_name",
  "date_of_birth",
  "school",
  "course",
  "programme_code",
  "parent_name",
  "parent_phone",
  "email",
  "phone",
  "lead_source",
] as const;

export type BulkColumn = (typeof BULK_COLUMNS)[number];

export const BULK_COLUMN_HINTS: Record<BulkColumn, string> = {
  full_name: "Text, 2-120 characters",
  date_of_birth: "Date as YYYY-MM-DD",
  school: "Text, 2-160 characters",
  course: "Text, e.g. B.Tech CSE",
  programme_code: "Programme code exactly as configured, e.g. BTCSE26",
  parent_name: "Text, 2-120 characters",
  parent_phone: "Digits, 7-24 characters",
  email: "Valid, unique email address",
  phone: "Digits, 7-24 characters",
  lead_source:
    "One of WEBSITE, REFERRAL, WALK_IN, SOCIAL_MEDIA, EDUCATION_FAIR, SCHOOL_VISIT, OTHER",
};

const trimmed = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, message);

export const bulkRowSchema = z.object({
  full_name: trimmed(2, 120, "Full name must be 2-120 characters"),
  date_of_birth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
  school: trimmed(2, 160, "School must be 2-160 characters"),
  course: trimmed(1, 120, "Course is required"),
  programme_code: trimmed(1, 40, "Programme code is required"),
  parent_name: trimmed(2, 120, "Parent name must be 2-120 characters"),
  parent_phone: trimmed(7, 24, "Parent phone must be 7-24 characters"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: trimmed(7, 24, "Phone must be 7-24 characters"),
  lead_source: leadSourceSchema,
});

export type BulkRow = z.infer<typeof bulkRowSchema>;

export const bulkImportSchema = z.object({
  rows: z.array(bulkRowSchema).min(1, "Add at least one row").max(500, "Maximum 500 rows per file"),
});

export const SAMPLE_BULK_ROW: Record<BulkColumn, string> = {
  full_name: "Aarav Sharma",
  date_of_birth: "2007-04-12",
  school: "Delhi Public School",
  course: "B.Tech CSE",
  programme_code: "BTCSE26",
  parent_name: "Rohit Sharma",
  parent_phone: "9876543210",
  email: "aarav.sharma@example.com",
  phone: "9876500011",
  lead_source: "WEBSITE",
};
