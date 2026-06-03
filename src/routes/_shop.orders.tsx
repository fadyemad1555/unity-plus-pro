import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shop/orders")({
  component: OrdersPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground",
  confirmed: "bg-primary/20",
  shipped: "bg-blue-500/20",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const { data } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (loading) return <div className="container mx-auto p-8">…</div>;
  if (!user) return (
    <div className="container mx-auto p-16 text-center">
      <p className="mb-4">Please sign in to view your orders.</p>
      <Link to="/login"><Button className="btn-primary">{t.login}</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t.orders}</h1>
      {!data?.length ? (
        <p className="text-center text-muted-foreground py-16">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {data.map(o => (
            <div key={o.id} className="bg-card p-5 rounded-lg shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Order #{o.id.slice(0,8)}</div>
                  <div className="text-sm">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <Badge className={statusColor[o.status] ?? ""}>{o.status}</Badge>
                <div className="text-lg font-bold">ج.م {o.total}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {o.order_items?.map((it: any) => `${it.product_name} ×${it.quantity}`).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
