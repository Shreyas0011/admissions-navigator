import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, CalendarCheck, Ticket } from "lucide-react";

import { EnquiryForm } from "@/components/students/EnquiryForm";
import { APP_NAME } from "@/config/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admissions Enquiry — Start Your Application" },
      {
        name: "description",
        content:
          "Submit an admissions enquiry and get a dedicated counsellor, orientation seminar booking and entrance exam hall ticket.",
      },
      { property: "og:title", content: "Admissions Enquiry — Start Your Application" },
      {
        property: "og:description",
        content: "Submit an enquiry and get a dedicated counsellor within one working day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EnquiryPortal,
});

const STEPS = [
  { icon: ShieldCheck, title: "Dedicated counsellor", body: "Assigned within one working day." },
  { icon: CalendarCheck, title: "Orientation seminar", body: "Book a WOC session with QR check-in." },
  { icon: Ticket, title: "Entrance exam", body: "Hall ticket issued once counselling completes." },
];

function EnquiryPortal() {
  return (
    <div className="min-h-screen bg-surface-low">
      <header className="bg-sidebar">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg font-bold text-sidebar-accent-foreground">{APP_NAME}</span>
          </span>
          <Link
            to="/auth"
            className="rounded-xl border border-sidebar-border px-4 py-2 text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="label-caps text-primary">Admissions 2026</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground">
            Start your admission journey
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Tell us a little about yourself. You'll receive a reference number instantly and a
            counsellor will guide you through every stage.
          </p>

          <ul className="mt-10 space-y-5">
            {STEPS.map((step) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <step.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{step.title}</span>
                  <span className="block text-sm text-muted-foreground">{step.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <section className="surface-card rounded-3xl p-8">
          <h2 className="text-xl font-semibold text-foreground">Enquiry form</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            All fields are required unless marked otherwise.
          </p>
          <EnquiryForm defaultSource="WEBSITE" />
        </section>
      </main>
    </div>
  );
}
