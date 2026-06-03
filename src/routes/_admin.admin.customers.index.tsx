import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { UserCheck, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";


export const Route = createFileRoute("/_admin/admin/customers/")({ component: Customers });

function Customers() {
  const { t } = useI18n();
  const { data = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders").select("customer_name, customer_phone, customer_address, total, created_at");
      const map = new Map<string, { name: string; phone: string; address: string; orderCount: number; total: number; last: string }>();
      (orders ?? []).forEach(o => {
        const key = o.customer_phone || o.customer_name;
        const existing = map.get(key);
        if (existing) {
          existing.orderCount += 1;
          existing.total += Number(o.total);
          if (o.created_at > existing.last) existing.last = o.created_at;
        } else {
          map.set(key, { name: o.customer_name, phone: o.customer_phone, address: o.customer_address, orderCount: 1, total: Number(o.total), last: o.created_at });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="h-6 w-6" />{t.customers}</h1>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">الاسم</th><th className="p-3 text-start">الهاتف</th><th className="p-3 text-start">الطلبات</th><th className="p-3 text-end">إجمالي المشتريات</th><th className="p-3 text-start">آخر طلب</th><th className="p-3"></th></tr></thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs" dir="ltr">{c.phone}</td>
                <td className="p-3">{c.orderCount}</td>
                <td className="p-3 text-end font-bold">{formatPrice(c.total)}</td>
                <td className="p-3 text-xs">{new Date(c.last).toLocaleDateString("ar-EG")}</td>
                <td className="p-3 text-end flex gap-1 justify-end">
                  {c.phone && (
                    <Link to="/admin/customers/$phone" params={{ phone: encodeURIComponent(c.phone) }}>
                      <Button size="sm" variant="ghost"><FileText className="h-4 w-4 text-primary" /></Button>
                    </Link>
                  )}
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener">
                      <Button size="sm" variant="ghost"><MessageCircle className="h-4 w-4 text-success" /></Button>
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا يوجد عملاء</td></tr>}
          </tbody>
        </table>

      </div>
    </div>
  );
}
