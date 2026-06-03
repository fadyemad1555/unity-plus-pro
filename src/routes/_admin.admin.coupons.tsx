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
import { Plus, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/coupons")({ component: Coupons });

function Coupons() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percent", discount_value: "", min_subtotal: "0",
    max_uses: "", is_active: true,
  });
  const { data = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(), discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_subtotal: Number(form.min_subtotal) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
    });
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); setOpen(false); qc.invalidateQueries({ queryKey: ["coupons"] }); }
  };
  const del = async (id: string) => { await supabase.from("coupons").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["coupons"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6" />{t.coupons}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.add} {t.coupon}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Code</Label><Input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="percent">Percent %</SelectItem><SelectItem value="fixed">Fixed amount</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Value</Label><Input type="number" step="0.01" required value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الحد الأدنى للسلة</Label><Input type="number" value={form.min_subtotal} onChange={e => setForm({ ...form, min_subtotal: e.target.value })} /></div>
                <div><Label>عدد مرات الاستخدام</Label><Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="غير محدود" /></div>
              </div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">الكود</th><th className="p-3 text-start">الخصم</th><th className="p-3 text-start">الحد الأدنى</th><th className="p-3 text-start">الاستخدام</th><th className="p-3"></th></tr></thead>
          <tbody>
            {data.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono font-bold">{c.code}</td>
                <td className="p-3">{c.discount_type === "percent" ? `${c.discount_value}%` : `ج.م ${c.discount_value}`}</td>
                <td className="p-3">ج.م {c.min_subtotal}</td>
                <td className="p-3">{c.uses}/{c.max_uses ?? "∞"}</td>
                <td className="p-3 text-end"><Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد كوبونات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
