import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getChatThreadFn, sendChatMessageFn } from "@/domains/chat/chat.functions";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const MAX = 2000;

/**
 * Private thread between a student and their assigned counsellor. Bodies are
 * rendered as plain text only.
 */
export function ChatThread({ studentId }: { studentId?: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const key = ["chat", "thread", studentId ?? "self"];
  const thread = useQuery({
    queryKey: key,
    queryFn: () => getChatThreadFn({ data: studentId ? { studentId } : {} }),
    refetchInterval: 15000,
    retry: false,
  });

  const send = useMutation({
    mutationFn: () =>
      sendChatMessageFn({ data: { body, ...(studentId ? { studentId } : {}) } }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ["chat", "unread"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (thread.isLoading) return <Skeleton className="h-72 rounded-2xl" />;
  if (thread.error) {
    return <p className="text-sm text-destructive">{(thread.error as Error).message}</p>;
  }

  const data = thread.data!;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="max-h-96 min-h-40 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border p-4">
        {data.messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello to {data.counterpartName}.
          </p>
        )}
        {data.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words",
                m.mine ? "bg-primary text-primary-foreground" : "bg-surface-container text-foreground",
              )}
            >
              {m.body}
              <span
                className={cn(
                  "mt-1 block text-[10px]",
                  m.mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatDateTime(m.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) send.mutate();
        }}
      >
        <Textarea
          rows={3}
          maxLength={MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message ${data.counterpartName}`}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {body.length}/{MAX}
          </span>
          <Button type="submit" disabled={send.isPending || body.trim().length === 0}>
            {send.isPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Send className="mr-1 size-4" />
            )}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
