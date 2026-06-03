import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Plus, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/suppliers/$id")({ component: SupplierDetail });

function SupplierDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", account_id: "", payment_method: "cash", notes: "" });

  const { data: supplier } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => (await supabase.from("suppliers").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["supplier-invoices", id],
    queryFn: async () => (await supabase.from("purchase_invoices").select("*").eq("supplier_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["supplier-payments", id],
    queryFn: async () => (await supabase.from("supplier_payments").select("*").eq("supplier_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["treasury-accounts"],
    queryFn: async () => (await supabase.from("treasury_accounts").select("*").eq("is_active", true)).data ?? [],
  });

  const totalPurchases = invoices.reduce((s, i: any) => s + Number(i.total), 0);
  const totalPaidOnInvoices = invoices.reduce((s, i: any) => s + Number(i.paid), 0);
  const totalPayments = payments.reduce((s, p: any) => s + Number(p.amount), 0);
  const balance = totalPurchases - totalPaidOnInvoices - totalPayments;

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("supplier_payments").insert({
      supplier_id: id,
      amount: Number(form.amount),
      account_id: form.account_id || null,
      payment_method: form.payment_method,
      notes: form.notes || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("تم تسجيل الدفعة");
      setOpen(false);
      setForm({ amount: "", account_id: "", payment_method: "cash", notes: "" });
      qc.invalidateQueries({ queryKey: ["supplier-payments", id] });
    }
  };

  const sendReportWa = () => {
    if (!supplier) return;
    const lines = [
      `📊 تقرير المورد - ${supplier.name}`,
      `إجمالي المشتريات: ${formatPrice(totalPurchases)}`,
      `مدفوع على الفواتير: ${formatPrice(totalPaidOnInvoices)}`,
      `إجمالي الدفعات: ${formatPrice(totalPayments)}`,
      `المتبقي عليكم: ${formatPrice(balance)}`,
      ``,
      `عدد الفواتير: ${invoices.length}`,
    ].join("\n");
    const phone = (supplier.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  if (!supplier) return <div className="p-8">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/admin/suppliers" className="text-sm text-primary flex items-center gap-1 mb-1"><ArrowRight className="h-4 w-4" /> العودة للموردين</Link>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">{supplier.phone} {supplier.email && `• ${supplier.email}`}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={sendReportWa} className="bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="h-4 w-4 me-2" />إرسال التقرير واتساب</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />تسجيل دفعة</Button></DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>تسجيل دفعة للمورد</DialogTitle></DialogHeader>
              <form onSubmit={submitPayment} className="space-y-3">
                <div><Label>المبلغ</Label><Input required type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>الخزنة (طريقة الدفع)</Label>
                  <select required className="w-full h-10 rounded-md border bg-background px-3" value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })}>
                    <option value="">اختر الخزنة</option>
                    {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div><Label>طريقة الدفع</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة</option>
                    <option value="transfer">تحويل بنكي</option>
                    <option value="wallet">محفظة إلكترونية</option>
                  </select>
                </div>
                <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" className="btn-primary w-full">حفظ الدفعة</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="إجمالي المشتريات" value={formatPrice(totalPurchases)} />
        <StatCard label="مدفوع على الفواتير" value={formatPrice(totalPaidOnInvoices)} />
        <StatCard label="إجمالي الدفعات" value={formatPrice(totalPayments)} />
        <StatCard label="المتبقي" value={formatPrice(balance)} highlight={balance > 0} />
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2">فواتير المشتريات</h2>
        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-3 text-start">التاريخ</th><th className="p-3 text-start">رقم الفاتورة</th><th className="p-3 text-end">الإجمالي</th><th className="p-3 text-end">المدفوع</th><th className="p-3 text-end">المتبقي</th></tr></thead>
            <tbody>
              {invoices.map((i: any) => (
                <tr key={i.id} className="border-t">
                  <td className="p-3">{new Date(i.created_at).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3 font-mono text-xs">{i.id.slice(0, 8)}</td>
                  <td className="p-3 text-end">{formatPrice(i.total)}</td>
                  <td className="p-3 text-end">{formatPrice(i.paid)}</td>
                  <td className="p-3 text-end font-bold text-destructive">{formatPrice(Number(i.total) - Number(i.paid))}</td>
                </tr>
              ))}
              {!invoices.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد فواتير</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">سجل الدفعات</h2>
        <div className="bg-card rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-3 text-start">التاريخ</th><th className="p-3 text-end">المبلغ</th><th className="p-3 text-start">الخزنة</th><th className="p-3 text-start">طريقة الدفع</th><th className="p-3 text-start">ملاحظات</th></tr></thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{new Date(p.paid_at).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3 text-end font-bold text-success">{formatPrice(p.amount)}</td>
                  <td className="p-3">{accounts.find((a: any) => a.id === p.account_id)?.name || "-"}</td>
                  <td className="p-3">{p.payment_method}</td>
                  <td className="p-3 text-xs text-muted-foreground">{p.notes}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد دفعات</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card rounded-lg shadow-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 ${highlight ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
