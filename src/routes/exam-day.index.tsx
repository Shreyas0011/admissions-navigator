import { createFileRoute } from "@tanstack/react-router";

import { GroundLogin } from "@/components/attendance/GroundLogin";

export const Route = createFileRoute("/exam-day/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam Day Check-in — Admissions OS" },
      {
        name: "description",
        content: "Ground staff check-in for today's entrance exam sessions.",
      },
      { property: "og:title", content: "Exam Day Check-in — Admissions OS" },
      { property: "og:description", content: "Ground staff attendance console for today's exams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <GroundLogin purpose="EXAM" consolePath="/exam-day/console" />,
});
