import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/damaged")({ component: Damaged });

function Damaged() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", product_name: "", quantity: "1", unit_cost: "0", reason: "", recorded_at: new Date().toISOString().slice(0, 10) });
  const { data = [] } = useQuery({
    queryKey: ["damaged"],
    queryFn: async () => (await supabase.from("damaged_items").select("*").order("recorded_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-pick"],
    queryFn: async () => (await supabase.from("products").select("id, name_en, cost").order("name_en")).data ?? [],
  });

  const totalLoss = data.reduce((s, d) => s + Number(d.unit_cost) * d.quantity, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === form.product_id);
    const { error } = await supabase.from("damaged_items").insert({
      product_id: form.product_id || null,
      product_name: form.product_name || product?.name_en || "Unknown",
      quantity: Number(form.quantity),
      unit_cost: Number(form.unit_cost) || Number(product?.cost) || 0,
      reason: form.reason || null,
      recorded_at: form.recorded_at,
    });
    if (error) toast.error(error.message);
    else { toast.success("Recorded"); setOpen(false); qc.invalidateQueries({ queryKey: ["damaged"] }); qc.invalidateQueries({ queryKey: ["inv"] }); }
  };
  const del = async (id: string) => { await supabase.from("damaged_items").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["damaged"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive" />{t.damaged}</h1>
          <p className="text-sm text-muted-foreground">Total loss: <span className="font-bold text-destructive">ج.م {totalLoss.toFixed(2)}</span></p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.recordDamaged}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Product</Label>
                <Select value={form.product_id} onValueChange={v => {
                  const p = products.find(x => x.id === v);
                  setForm({ ...form, product_id: v, product_name: p?.name_en ?? "", unit_cost: String(p?.cost ?? 0) });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                <div><Label>Unit cost</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} /></div>
              </div>
              <div><Label>Reason</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Broken, expired..." /></div>
              <div><Label>Date</Label><Input type="date" value={form.recorded_at} onChange={e => setForm({ ...form, recorded_at: e.target.value })} /></div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">Date</th><th className="p-3 text-start">Product</th><th className="p-3 text-start">Qty</th><th className="p-3 text-start">Reason</th><th className="p-3 text-end">Loss</th><th className="p-3"></th></tr></thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.recorded_at}</td>
                <td className="p-3 font-medium">{d.product_name}</td>
                <td className="p-3">{d.quantity}</td>
                <td className="p-3">{d.reason ?? "—"}</td>
                <td className="p-3 text-end font-bold text-destructive">-${(Number(d.unit_cost) * d.quantity).toFixed(2)}</td>
                <td className="p-3 text-end"><Button size="sm" variant="ghost" onClick={() => del(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No damaged items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
