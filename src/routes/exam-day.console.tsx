import { createFileRoute } from "@tanstack/react-router";

import { GroundConsole } from "@/components/attendance/GroundConsole";

export const Route = createFileRoute("/exam-day/console")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam Check-in Console — Admissions OS" },
      { name: "description", content: "Scan hall-ticket QR passes and record exam attendance." },
      { property: "og:title", content: "Exam Check-in Console — Admissions OS" },
      { property: "og:description", content: "Live exam attendance console for ground staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <GroundConsole loginPath="/exam-day" />,
});
