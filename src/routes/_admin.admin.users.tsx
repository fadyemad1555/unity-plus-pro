import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { listUsers, setUserRole } from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/users")({ component: UsersPage });

function UsersPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const updateRole = useServerFn(setUserRole);
  const { data = [], isLoading } = useQuery({ queryKey: ["users-list"], queryFn: () => fetchUsers() });

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateRole({ data: { userId, role: "admin", grant: !isAdmin } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["users-list"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" />{t.users}</h1>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">Email</th><th className="p-3 text-start">Name</th><th className="p-3 text-start">Roles</th><th className="p-3 text-start">Last sign-in</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-8 text-center">Loading…</td></tr>}
            {data.map(u => {
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3">{u.full_name ?? "—"}</td>
                  <td className="p-3 space-x-1">
                    {u.roles.map(r => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}
                  </td>
                  <td className="p-3 text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}</td>
                  <td className="p-3 text-end">
                    <Button size="sm" variant={isAdmin ? "outline" : "default"} onClick={() => toggleAdmin(u.id, isAdmin)}>
                      {isAdmin ? <><ShieldOff className="h-4 w-4 me-1" />Revoke admin</> : <><Shield className="h-4 w-4 me-1" />Make admin</>}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
