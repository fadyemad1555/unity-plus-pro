import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// List auth users (admin only). Returns email, id, created_at, full_name.
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Verify caller is admin
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map(u => u.id);
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles").select("user_id, role").in("user_id", ids);
    return data.users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: (u.user_metadata as any)?.full_name ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: (roleRows ?? []).filter(r => r.user_id === u.id).map(r => r.role),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "user"; grant: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!roles?.some(r => r.role === "admin")) throw new Error("Forbidden");
    if (data.grant) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: data.userId, role: data.role }, { onConflict: "user_id,role" }
      );
    } else {
      await supabaseAdmin.from("user_roles").delete()
        .eq("user_id", data.userId).eq("role", data.role);
    }
    return { ok: true };
  });
