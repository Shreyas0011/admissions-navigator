import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentActor } from "@/domains/users/users.functions";

/**
 * Route-level persona boundary. Server functions enforce the same rule, this
 * keeps a deep-linked admin surface from rendering for other staff roles.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["current-actor"],
    queryFn: () => getCurrentActor(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (!data?.isAdmin) {
    return (
      <div className="surface-card mx-auto max-w-md rounded-2xl p-10 text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold text-foreground">Not available for your role</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is restricted to admissions administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
