import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { PortalShell } from "@/components/portal/PortalShell";
import { StudentPasswordGate } from "@/components/portal/StudentPasswordGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: () => (
    <PortalShell>
      <StudentPasswordGate>
        <Outlet />
      </StudentPasswordGate>
    </PortalShell>
  ),
});
