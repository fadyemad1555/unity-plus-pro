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
import { Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/expenses")({ component: Expenses });

function Expenses() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", amount: "", account_id: "", payment_method: "cash", notes: "", spent_at: new Date().toISOString().slice(0, 10) });
  const { data = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await supabase.from("expenses").select("*").order("spent_at", { ascending: false })).data ?? [],
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await supabase.from("treasury_accounts").select("*")).data ?? [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => (await supabase.from("expense_categories").select("*").order("name")).data ?? [],
  });

  const total = data.reduce((s, e) => s + Number(e.amount), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert({
      title: form.title, category: form.category || null,
      amount: Number(form.amount),
      account_id: form.account_id || null,
      payment_method: form.payment_method,
      notes: form.notes || null, spent_at: form.spent_at,
    });
    if (error) { toast.error(error.message); return; }
    if (form.account_id) {
      await supabase.from("treasury_transactions").insert({
        kind: "expense" as any, amount: Number(form.amount),
        from_account_id: form.account_id, description: `مصروف: ${form.title}`,
        payment_method: form.payment_method,
      });
    }
    toast.success("تم الحفظ"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };
  const del = async (id: string) => { await supabase.from("expenses").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["expenses"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6" />{t.expenses}</h1>
          <p className="text-sm text-muted-foreground">الإجمالي: <span className="font-bold text-destructive">{formatPrice(total)}</span></p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة مصروف</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>البيان</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: فاتورة كهرباء" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>النوع</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>المبلغ</Label><Input type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الخزنة</Label>
                  <Select value={form.account_id} onValueChange={v => setForm({ ...form, account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t.paymentMethod}</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[["cash","كاش"],["visa","فيزا"],["mastercard","ماستركارد"],["instapay","إنستا باي"]].map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>التاريخ</Label><Input type="date" value={form.spent_at} onChange={e => setForm({ ...form, spent_at: e.target.value })} /></div>
              <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">التاريخ</th><th className="p-3 text-start">البيان</th><th className="p-3 text-start">النوع</th><th className="p-3 text-start">طريقة الدفع</th><th className="p-3 text-end">المبلغ</th><th className="p-3"></th></tr></thead>
          <tbody>
            {data.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.spent_at}</td>
                <td className="p-3 font-medium">{e.title}</td>
                <td className="p-3">{e.category ?? "—"}</td>
                <td className="p-3">{e.payment_method}</td>
                <td className="p-3 text-end font-bold text-destructive">-{formatPrice(e.amount)}</td>
                <td className="p-3 text-end"><Button size="sm" variant="ghost" onClick={() => del(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد مصروفات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
