import { z } from "zod";

/** Admin-created counsellor login: email + password only, the rest is self-served. */
export const counsellorAccountSchema = z.object({
  email: z.string().trim().email("Enter a valid work email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type CounsellorAccountInput = z.infer<typeof counsellorAccountSchema>;

/** Fields a counsellor owns on their own directory record. */
export const counsellorProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  maxActiveLeads: z.coerce.number().int().min(1).max(500).default(50),
});

export type CounsellorProfileInput = z.infer<typeof counsellorProfileSchema>;

export const passwordResetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
