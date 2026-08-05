import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CounsellorAccountInput } from "./schema";

/**
 * Module 3b — an admin provisions a counsellor login.
 *
 * Counsellors never self-register: the admin creates the auth user (pre
 * confirmed), grants the `counsellor` role and links the directory row so
 * `current_counsellor_id()` resolves for that session.
 */
export async function createCounsellorAccount(input: CounsellorAccountInput) {
  const email = input.email.trim().toLowerCase();

  const { data: existingCounsellor } = await supabaseAdmin
    .from("counsellors")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingCounsellor?.user_id) {
    throw new Error("A counsellor login already exists for this email.");
  }

  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (authError || !created.user) {
    throw new Error(authError?.message ?? "Could not create the counsellor login");
  }

  const userId = created.user.id;

  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "counsellor" });
  if (roleError && !roleError.message.includes("duplicate")) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(roleError.message);
  }

  if (existingCounsellor) {
    const { error } = await supabaseAdmin
      .from("counsellors")
      .update({
        user_id: userId,
        full_name: input.fullName,
        phone: input.phone || null,
        max_active_leads: input.maxActiveLeads,
        is_active: true,
      })
      .eq("id", existingCounsellor.id);
    if (error) throw new Error(error.message);
    return { counsellorId: existingCounsellor.id, email };
  }

  const { data, error } = await supabaseAdmin
    .from("counsellors")
    .insert({
      user_id: userId,
      full_name: input.fullName,
      email,
      phone: input.phone || null,
      max_active_leads: input.maxActiveLeads,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(error.message);
  }

  return { counsellorId: data.id, email };
}
