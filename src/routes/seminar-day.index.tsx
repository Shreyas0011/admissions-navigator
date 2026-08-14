import { createFileRoute } from "@tanstack/react-router";

import { GroundLogin } from "@/components/attendance/GroundLogin";

export const Route = createFileRoute("/seminar-day/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Seminar Day Check-in — Admissions OS" },
      {
        name: "description",
        content: "Ground staff check-in for today's admission seminars.",
      },
      { property: "og:title", content: "Seminar Day Check-in — Admissions OS" },
      { property: "og:description", content: "Ground staff attendance console for today's seminars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <GroundLogin purpose="SEMINAR" consolePath="/seminar-day/console" />,
});
