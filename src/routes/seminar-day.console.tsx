import { createFileRoute } from "@tanstack/react-router";

import { GroundConsole } from "@/components/attendance/GroundConsole";

export const Route = createFileRoute("/seminar-day/console")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Check-in Console — Admissions OS" },
      { name: "description", content: "Scan student passes and record seminar attendance live." },
      { property: "og:title", content: "Check-in Console — Admissions OS" },
      { property: "og:description", content: "Live seminar attendance and walk-in console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <GroundConsole loginPath="/seminar-day" />,
});
