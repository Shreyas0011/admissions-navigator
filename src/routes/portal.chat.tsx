import { createFileRoute } from "@tanstack/react-router";

import { ChatThread } from "@/components/chat/ChatThread";

export const Route = createFileRoute("/portal/chat")({
  head: () => ({
    meta: [
      { title: "Chat with My Counsellor — Admissions OS" },
      {
        name: "description",
        content: "Private messages between you and the counsellor assigned to your application.",
      },
      { property: "og:title", content: "Chat with My Counsellor — Admissions OS" },
      { property: "og:description", content: "Private applicant and counsellor messaging." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalChatPage,
});

function PortalChatPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="label-caps text-primary">Messages</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Chat with my counsellor
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Only you and your assigned counsellor can see this conversation.
        </p>
      </header>

      <section className="surface-card rounded-2xl p-6">
        <ChatThread />
      </section>
    </div>
  );
}
