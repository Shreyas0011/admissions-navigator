import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/portal/exams")({
  head: () => ({
    meta: [
      { title: "Exam Registration — Admissions OS" },
      { name: "description", content: "Register for your entrance exam once counselling completes." },
      { property: "og:title", content: "Exam Registration — Admissions OS" },
      { property: "og:description", content: "Entrance exam registration for applicants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Entrance exam</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Exams</h1>
      </header>

      <section className="surface-card rounded-2xl p-10 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <FileText className="size-6" />
        </span>
        <p className="mt-4 text-base font-medium text-foreground">Exam registration opens soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Once you complete counselling, your entrance exam slot and hall ticket will appear here.
        </p>
      </section>
    </div>
  );
}
