import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.orders}</h1>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">#</th><th className="p-3 text-start">Customer</th><th className="p-3 text-start">{t.total}</th><th className="p-3 text-start">Status</th><th className="p-3 text-start">{t.actions}</th></tr></thead>
          <tbody>
            {data?.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs">{o.id.slice(0,8)}</td>
                <td className="p-3">{o.customer_name}<div className="text-xs text-muted-foreground">{o.customer_phone}</div></td>
                <td className="p-3 font-bold">ج.م {o.total}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{["pending","confirmed","shipped","delivered","cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
