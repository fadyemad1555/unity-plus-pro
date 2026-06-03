import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Printer, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/reports")({ component: Reports });

function Reports() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [orders, treasury] = await Promise.all([
        supabase.from("orders").select("total, created_at"),
        supabase.from("treasury_transactions").select("kind, amount, created_at"),
      ]);
      const oData = orders.data ?? [];
      const tData = treasury.data ?? [];
      const totalSales = oData.reduce((s, o) => s + Number(o.total), 0);
      const expenses = tData.filter(t => ["expense","withdraw","purchase"].includes(t.kind)).reduce((s, t) => s + Number(t.amount), 0);
      const income = tData.filter(t => ["income","deposit","sale"].includes(t.kind)).reduce((s, t) => s + Number(t.amount), 0);
      const monthly = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const key = d.toISOString().slice(0, 7);
        return {
          month: d.toLocaleDateString("en", { month: "short" }),
          sales: oData.filter(o => o.created_at.startsWith(key)).reduce((s, o) => s + Number(o.total), 0),
          expenses: tData.filter(t => t.created_at.startsWith(key) && ["expense","withdraw","purchase"].includes(t.kind)).reduce((s, t) => s + Number(t.amount), 0),
        };
      });
      return { totalSales, expenses, income, profits: income - expenses, monthly };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.reports}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 me-2" />طباعة</Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Amira Made — تقرير\nالمبيعات: ج.م ${(data?.totalSales ?? 0).toFixed(2)}\nالمصروفات: ج.م ${(data?.expenses ?? 0).toFixed(2)}\nالأرباح: ج.م ${(data?.profits ?? 0).toFixed(2)}`)}`, "_blank")}><MessageCircle className="h-4 w-4 me-2" />واتساب</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KPI label={t.sales} value={`ج.م ${(data?.totalSales ?? 0).toFixed(2)}`} color="text-success" />
        <KPI label={t.expenses} value={`ج.م ${(data?.expenses ?? 0).toFixed(2)}`} color="text-destructive" />
        <KPI label={t.profits} value={`ج.م ${(data?.profits ?? 0).toFixed(2)}`} color="text-primary" />
      </div>
      <div className="bg-card rounded-lg p-5 shadow-card">
        <h3 className="font-semibold mb-4">Monthly performance</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data?.monthly ?? []}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
            <Bar dataKey="sales" fill="#ff9900" />
            <Bar dataKey="expenses" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function KPI({ label, value, color }: any) {
  return <div className="bg-card rounded-lg p-5 shadow-card"><div className="text-sm text-muted-foreground">{label}</div><div className={`text-3xl font-bold ${color}`}>{value}</div></div>;
}
