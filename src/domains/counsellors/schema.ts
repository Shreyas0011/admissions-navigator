import { z } from "zod";

/** Admin-created counsellor login + directory record. */
export const counsellorAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().email("Enter a valid work email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(24).optional(),
  maxActiveLeads: z.number().int().min(1).max(500).default(50),
});

export type CounsellorAccountInput = z.infer<typeof counsellorAccountSchema>;
