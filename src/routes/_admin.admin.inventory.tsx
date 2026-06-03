import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/inventory")({ component: Inventory });

function Inventory() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["inv"],
    queryFn: async () => (await supabase.from("products").select("id, name_en, name_ar, stock, low_stock_threshold, price").order("stock")).data ?? [],
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.inventory}</h1>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">{t.name}</th><th className="p-3 text-start">{t.stock}</th><th className="p-3 text-start">Threshold</th><th className="p-3 text-start">Status</th></tr></thead>
          <tbody>
            {data?.map(p => {
              const low = p.stock <= p.low_stock_threshold;
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.name_en}</td>
                  <td className="p-3"><span className={`font-bold ${low ? "text-destructive" : "text-success"}`}>{p.stock}</span></td>
                  <td className="p-3">{p.low_stock_threshold}</td>
                  <td className="p-3">{low ? <span className="inline-flex items-center gap-1 text-destructive text-xs font-semibold"><AlertTriangle className="h-3 w-3"/>{t.lowStock}</span> : <span className="text-success text-xs font-semibold">OK</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
