import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { sendMessageSchema, threadInputSchema } from "./schema";

export const getChatThreadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => threadInputSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { getThread } = await import("./chat.service");
    return getThread(context.userId, data.studentId);
  });

export const sendChatMessageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendMessageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { sendMessage } = await import("./chat.service");
    return sendMessage(context.userId, data.body, data.studentId);
  });

export const listChatUnreadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listCounsellorUnread } = await import("./chat.service");
    return listCounsellorUnread(context.userId);
  });
