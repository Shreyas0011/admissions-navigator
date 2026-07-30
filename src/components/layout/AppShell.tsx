import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentActor } from "@/domains/users/users.functions";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: actor } = useQuery({
    queryKey: ["current-actor"],
    queryFn: () => getCurrentActor(),
    staleTime: 5 * 60_000,
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-surface-low">
      <Sidebar
        roles={actor?.roles ?? []}
        onSignOut={handleSignOut}
        onNewApplication={() => navigate({ to: "/students", search: { new: true } })}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar name={actor?.label ?? "Loading..."} roles={actor?.roles ?? []} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
