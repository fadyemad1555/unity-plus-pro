import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingCart, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_admin/admin/")({
  component: Dashboard,
});

const COLORS = ["#ff9900", "#232f3e", "#0ea5e9", "#10b981", "#ef4444"];

function Dashboard() {
  const { t } = useI18n();

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, suppliers, treasury, lowStock] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, status"),
        supabase.from("suppliers").select("*", { count: "exact", head: true }),
        supabase.from("treasury_transactions").select("kind, amount"),
        supabase.from("products").select("id, name_en, stock, low_stock_threshold").lte("stock", 5).limit(5),
      ]);
      const ordersData = orders.data ?? [];
      const totalSales = ordersData.reduce((s, o) => s + Number(o.total), 0);
      const treasuryBalance = (treasury.data ?? []).reduce((s, t) => {
        const inflow = ["deposit","sale","income"].includes(t.kind);
        return s + (inflow ? Number(t.amount) : -Number(t.amount));
      }, 0);
      // chart data: last 7 days sales
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0,10);
        const sum = ordersData.filter(o => o.created_at.slice(0,10) === key).reduce((s, o) => s + Number(o.total), 0);
        return { day: d.toLocaleDateString("en", { weekday: "short" }), sales: sum };
      });
      const statusBreakdown = ["pending","confirmed","shipped","delivered","cancelled"].map(s => ({
        name: s, value: ordersData.filter(o => o.status === s).length,
      })).filter(x => x.value > 0);
      return {
        productCount: products.count ?? 0,
        ordersCount: ordersData.length,
        totalSales,
        suppliersCount: suppliers.count ?? 0,
        treasuryBalance,
        lowStock: lowStock.data ?? [],
        chart: days,
        statusBreakdown,
      };
    },
  });

  const s = stats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPI icon={DollarSign} label={t.sales} value={formatPrice(s?.totalSales ?? 0)} color="bg-success/10 text-success" />
        <KPI icon={ShoppingCart} label={t.orders} value={s?.ordersCount ?? 0} color="bg-primary/10 text-primary" />
        <KPI icon={Package} label={t.products} value={s?.productCount ?? 0} color="bg-blue-500/10 text-blue-500" />
        <KPI icon={Users} label={t.suppliers} value={s?.suppliersCount ?? 0} color="bg-purple-500/10 text-purple-500" />
        <KPI icon={TrendingUp} label={t.treasury} value={formatPrice(s?.treasuryBalance ?? 0)} color="bg-warning/10 text-warning-foreground" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card rounded-lg p-5 shadow-card">
          <h3 className="font-semibold mb-4">Sales — last 7 days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={s?.chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#ff9900" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card">
          <h3 className="font-semibold mb-4">Order status</h3>
          {s?.statusBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={s.statusBreakdown} dataKey="value" nameKey="name" outerRadius={90}>
                  {s.statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No orders yet</p>}
        </div>
      </div>

      {(s?.lowStock?.length ?? 0) > 0 && (
        <div className="bg-card rounded-lg p-5 shadow-card border-l-4 border-warning">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold">{t.lowStock}</h3>
          </div>
          <div className="space-y-2">
            {s!.lowStock.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.name_en}</span>
                <span className="font-bold text-destructive">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card">
      <div className={`grid h-10 w-10 place-items-center rounded-md mb-2 ${color}`}><Icon className="h-5 w-5" /></div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
