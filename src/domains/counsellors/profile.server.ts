import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CounsellorProfileInput } from "./schema";

export type MyCounsellorProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  max_active_leads: number;
  is_active: boolean;
  must_reset_password: boolean;
};

export async function getMyCounsellorProfile(userId: string): Promise<MyCounsellorProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("counsellors")
    .select("id, full_name, email, phone, max_active_leads, is_active, must_reset_password")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMyCounsellorProfile(userId: string, input: CounsellorProfileInput) {
  const { error } = await supabaseAdmin
    .from("counsellors")
    .update({
      full_name: input.fullName,
      phone: input.phone?.trim() ? input.phone.trim() : null,
      max_active_leads: input.maxActiveLeads,
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", userId);

  return { ok: true };
}

/** First login: the browser updates its own password, then this clears the gate. */
export async function completeFirstLoginReset(userId: string) {
  const { error: flagError } = await supabaseAdmin
    .from("counsellors")
    .update({ must_reset_password: false })
    .eq("user_id", userId);
  if (flagError) throw new Error(flagError.message);

  return { ok: true };
}
