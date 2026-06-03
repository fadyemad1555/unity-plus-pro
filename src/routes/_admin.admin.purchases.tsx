import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Eye, Pencil } from "lucide-react";
import { InvoiceForm, EditInvoiceDialog } from "./_admin.admin.sales";
import { formatPrice } from "@/lib/format";
import { InvoiceDocument } from "@/components/InvoiceDocument";

export const Route = createFileRoute("/_admin/admin/purchases")({ component: PurchaseInvoices });

const PAY_LABEL: Record<string, string> = { cash: "كاش", visa: "فيزا", mastercard: "ماستركارد", instapay: "إنستا باي", cod: "عند الاستلام" };

function PurchaseInvoices() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: async () => (await supabase.from("purchase_invoices").select("*, suppliers(name, phone)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-mini"],
    queryFn: async () => (await supabase.from("products").select("id,name_en,name_ar,price,cost").order("name_ar")).data ?? [],
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["treasury-accounts"],
    queryFn: async () => (await supabase.from("treasury_accounts").select("*").eq("is_active", true)).data ?? [],
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("name")).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await supabase.from("purchase_invoices").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
  };

  const viewing: any = invoices.find((i: any) => i.id === viewId);
  const editing: any = invoices.find((i: any) => i.id === editId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">فواتير المشتريات</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />فاتورة جديدة</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>فاتورة مشتريات جديدة</DialogTitle></DialogHeader>
            <InvoiceForm
              kind="purchase" products={products} accounts={accounts} suppliers={suppliers}
              onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["purchase-invoices"] }); qc.invalidateQueries({ queryKey: ["products-mini"] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>
            <th className="p-3 text-start">#</th>
            <th className="p-3 text-start">المورد</th>
            <th className="p-3 text-start">الإجمالي</th>
            <th className="p-3 text-start">المدفوع</th>
            <th className="p-3 text-start">طريقة الدفع</th>
            <th className="p-3 text-start">إجراءات</th>
          </tr></thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 font-mono text-xs">{inv.id.slice(0, 8)}</td>
                <td className="p-3 font-medium">{inv.suppliers?.name ?? "—"}</td>
                <td className="p-3 font-bold">{formatPrice(inv.total)}</td>
                <td className="p-3">{formatPrice(inv.paid)}</td>
                <td className="p-3">{PAY_LABEL[inv.payment_method] ?? inv.payment_method}</td>
                <td className="p-3 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setViewId(inv.id)}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(inv.id)}><Pencil className="h-4 w-4 text-primary" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(inv.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {!invoices.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا توجد فواتير</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewId} onOpenChange={o => !o && setViewId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>عرض الفاتورة</DialogTitle></DialogHeader>
          {viewing && <PurchaseView invoice={viewing} accounts={accounts} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={o => !o && setEditId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل فاتورة المشتريات</DialogTitle></DialogHeader>
          {editing && <EditInvoiceDialog kind="purchase" invoice={editing} products={products} accounts={accounts} suppliers={suppliers} onSaved={() => {
            setEditId(null);
            qc.invalidateQueries({ queryKey: ["purchase-invoices"] });
          }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PurchaseView({ invoice, accounts }: { invoice: any; accounts: any[] }) {
  const { data: items = [] } = useQuery({
    queryKey: ["purchase-invoice-items", invoice.id],
    queryFn: async () => (await supabase.from("purchase_invoice_items").select("*").eq("invoice_id", invoice.id)).data ?? [],
  });
  const acc = accounts.find(a => a.id === invoice.account_id);
  const lines = items.map((it: any) => ({ product_name: it.product_name, quantity: it.quantity, unit_price: Number(it.unit_cost ?? 0) }));
  return (
    <InvoiceDocument
      kind="purchase"
      id={invoice.id}
      partyName={invoice.suppliers?.name ?? "—"}
      partyPhone={invoice.suppliers?.phone ?? ""}
      date={invoice.created_at}
      lines={lines}
      total={Number(invoice.total)}
      paid={Number(invoice.paid)}
      paymentMethod={PAY_LABEL[invoice.payment_method] ?? invoice.payment_method}
      accountName={acc?.name}
      notes={invoice.notes}
    />
  );
}
