import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ADMIN_EMAIL = "admin@store.local";
export const ADMIN_PASSWORD = "AdminAdmin";

const SEED_ADMINS: Array<{ email: string; password: string; name: string }> = [
  { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: "Administrator" },
  { email: "hodabdh3@gmail.com", password: "MahmoudAli12345#", name: "Hoda" },
];

// Idempotent: ensures bootstrap admin accounts exist with the admin role.
export const ensureAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });

  for (const seed of SEED_ADMINS) {
    let user = list?.users.find(u => u.email?.toLowerCase() === seed.email.toLowerCase());
    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: seed.email,
        password: seed.password,
        email_confirm: true,
        user_metadata: { full_name: seed.name },
      });
      if (error) throw new Error(error.message);
      user = data.user!;
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  }
  return { ok: true };
});
