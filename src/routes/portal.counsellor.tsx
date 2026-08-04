import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, UserCheck } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getMyApplicationFn } from "@/domains/portal/portal.functions";

export const Route = createFileRoute("/portal/counsellor")({
  head: () => ({
    meta: [
      { title: "My Counsellor — Admissions OS" },
      { name: "description", content: "Contact details for the counsellor guiding your admission." },
      { property: "og:title", content: "My Counsellor — Admissions OS" },
      { property: "og:description", content: "Your assigned admissions counsellor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorPage,
});

function CounsellorPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal", "application"],
    queryFn: () => getMyApplicationFn(),
  });

  const counsellor = data?.student.counsellors ?? null;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Support</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">My counsellor</h1>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : counsellor ? (
        <section className="surface-card rounded-2xl p-6">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <UserCheck className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-foreground">{counsellor.full_name}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> {counsellor.email}
          </p>
          {counsellor.phone && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" /> {counsellor.phone}
            </p>
          )}
        </section>
      ) : (
        <section className="surface-card rounded-2xl p-8 text-center">
          <p className="text-base font-medium text-foreground">A counsellor is being assigned</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You will see their details here as soon as your application is allocated.
          </p>
        </section>
      )}
    </div>
  );
}
