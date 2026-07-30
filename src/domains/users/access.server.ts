import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/domains/admissions/types";

type UserClient = SupabaseClient<Database>;

export type Actor = {
  userId: string;
  label: string;
  roles: AppRole[];
  isAdmin: boolean;
};

/**
 * Reads the caller's identity through their own RLS-scoped client — never the
 * admin client. Role decisions must be made with the caller's privileges.
 */
export async function loadActor(supabase: UserClient, userId: string): Promise<Actor> {
  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as AppRole);
  const label = profile?.full_name?.trim() || profile?.email || "Staff member";

  return {
    userId,
    label,
    roles,
    isAdmin: roles.includes("super_admin") || roles.includes("admissions_admin"),
  };
}

export async function requireStaff(supabase: UserClient, userId: string): Promise<Actor> {
  const actor = await loadActor(supabase, userId);
  if (actor.roles.length === 0) throw new Error("Forbidden: no staff role assigned");
  return actor;
}

export async function requireAdmin(supabase: UserClient, userId: string): Promise<Actor> {
  const actor = await loadActor(supabase, userId);
  if (!actor.isAdmin) throw new Error("Forbidden: admin role required");
  return actor;
}
