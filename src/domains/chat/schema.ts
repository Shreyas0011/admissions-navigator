import { z } from "zod";

export const threadInputSchema = z.object({
  studentId: z.string().uuid().optional(),
});

export const sendMessageSchema = z.object({
  studentId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Write a message").max(2000, "Messages are limited to 2000 characters"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
