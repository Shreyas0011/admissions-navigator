import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { Skeleton } from "@/components/ui/skeleton";
import { getMyApplicationFn } from "@/domains/portal/portal.functions";
import { buildStudentQrPayload } from "@/lib/qr";

export const Route = createFileRoute("/portal/qr")({
  head: () => ({
    meta: [
      { title: "My QR Pass — Admissions OS" },
      {
        name: "description",
        content: "Show this QR pass at seminar check-in to record your attendance.",
      },
      { property: "og:title", content: "My QR Pass — Admissions OS" },
      { property: "og:description", content: "Your personal admissions check-in pass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyQrPage,
});

function MyQrPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "application"],
    queryFn: () => getMyApplicationFn(),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  const { student } = data;
  const payload = buildStudentQrPayload(student.id, student.full_name);

  return (
    <div className="space-y-8">
      <header>
        <p className="label-caps text-primary">Check-in</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">My QR pass</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Show this to the ground staff at any seminar or exam centre. It never changes — it simply
          identifies you.
        </p>
      </header>

      <section className="surface-card mx-auto flex max-w-sm flex-col items-center gap-5 rounded-2xl p-8">
        <div className="rounded-2xl bg-card p-4">
          <QRCodeSVG value={payload} size={224} level="M" marginSize={2} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{student.full_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{student.student_code}</p>
        </div>
      </section>
    </div>
  );
}
