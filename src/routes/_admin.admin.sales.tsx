import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { ProductCombobox } from "@/components/ProductCombobox";
import { InvoiceDocument } from "@/components/InvoiceDocument";

export const Route = createFileRoute("/_admin/admin/sales")({ component: SalesInvoices });

type InvoiceKind = "sales" | "purchase";
type Line = { product_id: string | null; product_name: string; quantity: number; unit_price: number };
type InvoiceSeed = {
  customerName?: string;
  supplierId?: string | null;
  accountId?: string | null;
  paymentMethod?: "cash" | "cod" | "visa" | "mastercard" | "instapay";
  paid?: number;
  notes?: string | null;
  lines?: Line[];
};

const PAY_METHODS: ["cash" | "cod" | "visa" | "mastercard" | "instapay", string][] = [["cash", "كاش"], ["visa", "فيزا"], ["mastercard", "ماستركارد"], ["instapay", "إنستا باي"], ["cod", "عند الاستلام"]];

function SalesInvoices() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["sales-invoices"],
    queryFn: async () => (await supabase.from("sales_invoices").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products-mini"],
    queryFn: async () => (await supabase.from("products").select("id,name_en,name_ar,price,cost").order("name_ar")).data ?? [],
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["treasury-accounts"],
    queryFn: async () => (await supabase.from("treasury_accounts").select("*").eq("is_active", true)).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    const { data: tx } = await supabase.from("treasury_transactions").select("id").eq("reference_id", id).maybeSingle();
    if (tx?.id) await supabase.from("treasury_transactions").delete().eq("id", tx.id);
    await supabase.from("sales_invoices").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["sales-invoices"] });
    qc.invalidateQueries({ queryKey: ["treasury"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };

  const viewing = invoices.find((invoice: any) => invoice.id === viewId);
  const editing = invoices.find((invoice: any) => invoice.id === editId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">فواتير المبيعات</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />فاتورة جديدة</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>فاتورة مبيعات جديدة</DialogTitle></DialogHeader>
            <InvoiceForm kind="sales" products={products} accounts={accounts} onSaved={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["sales-invoices"] });
              qc.invalidateQueries({ queryKey: ["treasury"] });
              qc.invalidateQueries({ queryKey: ["accounts"] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">#</th><th className="p-3 text-start">العميل</th><th className="p-3 text-start">الإجمالي</th><th className="p-3 text-start">المدفوع</th><th className="p-3 text-start">طريقة الدفع</th><th className="p-3 text-start">إجراءات</th></tr></thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 font-mono text-xs">{inv.id.slice(0, 8)}</td>
                <td className="p-3 font-medium">{inv.customer_name}</td>
                <td className="p-3 font-bold">{formatPrice(inv.total)}</td>
                <td className="p-3">{formatPrice(inv.paid)}</td>
                <td className="p-3">{PAY_METHODS.find(([key]) => key === inv.payment_method)?.[1] ?? inv.payment_method}</td>
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

      <Dialog open={!!viewId} onOpenChange={(opened) => !opened && setViewId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>عرض الفاتورة</DialogTitle></DialogHeader>
          {viewing && <InvoiceView kind="sales" invoice={viewing} accounts={accounts} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(opened) => !opened && setEditId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل الفاتورة</DialogTitle></DialogHeader>
          {editing && <EditInvoiceDialog kind="sales" invoice={editing} products={products} accounts={accounts} onSaved={() => {
            setEditId(null);
            qc.invalidateQueries({ queryKey: ["sales-invoices"] });
            qc.invalidateQueries({ queryKey: ["treasury"] });
            qc.invalidateQueries({ queryKey: ["accounts"] });
          }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceView({ kind, invoice, accounts }: { kind: InvoiceKind; invoice: any; accounts: any[] }) {
  const { data: items = [] } = useQuery({
    queryKey: [kind === "sales" ? "sales-invoice-items" : "purchase-invoice-items", invoice.id],
    queryFn: async () => {
      const table = kind === "sales" ? "sales_invoice_items" : "purchase_invoice_items";
      return (await supabase.from(table).select("*").eq("invoice_id", invoice.id)).data ?? [];
    },
  });
  const account = accounts.find((item) => item.id === invoice.account_id);
  const lines = items.map((item: any) => ({ product_name: item.product_name, quantity: item.quantity, unit_price: Number(item.unit_price ?? item.unit_cost ?? 0) }));
  return <InvoiceDocument kind={kind} id={invoice.id} partyName={invoice.customer_name ?? "—"} date={invoice.created_at} lines={lines} total={Number(invoice.total)} paid={Number(invoice.paid)} paymentMethod={PAY_METHODS.find(([key]) => key === invoice.payment_method)?.[1] ?? invoice.payment_method} accountName={account?.name} notes={invoice.notes} />;
}

export function EditInvoiceDialog({ kind, invoice, products, accounts, suppliers, onSaved }: { kind: InvoiceKind; invoice: any; products: any[]; accounts: any[]; suppliers?: any[]; onSaved: () => void; }) {
  const { data: items = [] } = useQuery({
    queryKey: ["edit-invoice-items", kind, invoice.id],
    queryFn: async () => {
      const table = kind === "sales" ? "sales_invoice_items" : "purchase_invoice_items";
      return (await supabase.from(table).select("*").eq("invoice_id", invoice.id)).data ?? [];
    },
  });

  const initialValues = useMemo<InvoiceSeed>(() => ({
    customerName: invoice.customer_name ?? "",
    supplierId: invoice.supplier_id ?? "",
    accountId: invoice.account_id ?? "",
    paymentMethod: invoice.payment_method,
    paid: Number(invoice.paid ?? 0),
    notes: invoice.notes ?? "",
    lines: items.map((item: any) => ({ product_id: item.product_id ?? null, product_name: item.product_name, quantity: Number(item.quantity), unit_price: Number(item.unit_price ?? item.unit_cost ?? 0) })),
  }), [invoice, items]);

  return <InvoiceForm kind={kind} products={products} accounts={accounts} suppliers={suppliers} invoiceId={invoice.id} initialValues={initialValues} lockItems onSaved={onSaved} />;
}

async function syncInvoiceTreasury(kind: InvoiceKind, invoiceId: string, amount: number, accountId: string | null, paymentMethod: string, description: string) {
  const txKind = kind === "sales" ? "deposit" : "withdraw";
  const { data: existing } = await supabase.from("treasury_transactions").select("id").eq("reference_id", invoiceId).maybeSingle();

  if (!accountId || amount <= 0) {
    if (existing?.id) await supabase.from("treasury_transactions").delete().eq("id", existing.id);
    return;
  }

  const payload: any = {
    kind: txKind, amount, payment_method: paymentMethod, description, reference_id: invoiceId,
    to_account_id: kind === "sales" ? accountId : null,
    from_account_id: kind === "sales" ? null : accountId,
  };
  if (existing?.id) await supabase.from("treasury_transactions").update(payload).eq("id", existing.id);
  else await supabase.from("treasury_transactions").insert(payload);
}

export function InvoiceForm({ kind, products, accounts, suppliers, invoiceId, initialValues, lockItems = false, onSaved }: { kind: InvoiceKind; products: any[]; accounts: any[]; suppliers?: any[]; invoiceId?: string; initialValues?: InvoiceSeed; lockItems?: boolean; onSaved: () => void; }) {
  const [customerName, setCustomerName] = useState(initialValues?.customerName ?? "");
  const [supplierId, setSupplierId] = useState<string>(initialValues?.supplierId ?? "");
  const [accountId, setAccountId] = useState<string>(initialValues?.accountId ?? "");
  const [method, setMethod] = useState<"cash" | "cod" | "visa" | "mastercard" | "instapay">(initialValues?.paymentMethod ?? "cash");
  const [paid, setPaid] = useState<string>(String(initialValues?.paid ?? ""));
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(initialValues?.lines?.length ? initialValues.lines : [{ product_id: null, product_name: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [newProductMode, setNewProductMode] = useState<Record<number, boolean>>({});

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const addLine = () => setLines([...lines, { product_id: null, product_name: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (index: number) => setLines(lines.filter((_, lineIndex) => lineIndex !== index));
  const updateLine = (index: number, patch: Partial<Line>) => setLines(lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length || lines.some((line) => !line.product_name || line.quantity <= 0)) return toast.error("أضف صنف واحد على الأقل");
    setSaving(true);

    try {
      const paidNum = Number(paid) || 0;

      if (!invoiceId && kind === "purchase") {
        for (let index = 0; index < lines.length; index += 1) {
          if (newProductMode[index] && !lines[index].product_id && lines[index].product_name) {
            const { data: createdProduct, error } = await supabase.from("products").insert({ name_ar: lines[index].product_name, name_en: lines[index].product_name, price: lines[index].unit_price, cost: lines[index].unit_price, stock: 0 }).select().single();
            if (error) throw error;
            lines[index].product_id = createdProduct.id;
          }
        }
      }

      if (invoiceId) {
        const table = kind === "sales" ? "sales_invoices" : "purchase_invoices";
        const updatePayload: any = kind === "sales"
          ? { customer_name: customerName, total, paid: paidNum, payment_method: method, account_id: accountId || null, notes: notes || null }
          : { supplier_id: supplierId || null, total, paid: paidNum, payment_method: method, account_id: accountId || null, notes: notes || null };

        const { error } = await (supabase.from(table) as any).update(updatePayload).eq("id", invoiceId);
        if (error) throw error;

        if (!lockItems) {
          const itemsTable = kind === "sales" ? "sales_invoice_items" : "purchase_invoice_items";
          await supabase.from(itemsTable).delete().eq("invoice_id", invoiceId);
          const rows: any[] = kind === "sales"
            ? lines.map((line) => ({ invoice_id: invoiceId, product_id: line.product_id, product_name: line.product_name, unit_price: line.unit_price, quantity: line.quantity }))
            : lines.map((line) => ({ invoice_id: invoiceId, product_id: line.product_id, product_name: line.product_name, unit_cost: line.unit_price, quantity: line.quantity }));
          const { error: itemsError } = await (supabase.from(itemsTable) as any).insert(rows);
          if (itemsError) throw itemsError;
        }

        await syncInvoiceTreasury(kind, invoiceId, paidNum, accountId || null, method, kind === "sales" ? `فاتورة بيع ${invoiceId.slice(0, 8)}` : `فاتورة شراء ${invoiceId.slice(0, 8)}`);
      } else if (kind === "sales") {
        const { data: invoice, error } = await supabase.from("sales_invoices").insert({ customer_name: customerName, total, paid: paidNum, payment_method: method, account_id: accountId || null, notes: notes || null }).select().single();
        if (error) throw error;
        const { error: itemsError } = await supabase.from("sales_invoice_items").insert(lines.map((line) => ({ invoice_id: invoice.id, product_id: line.product_id, product_name: line.product_name, unit_price: line.unit_price, quantity: line.quantity })));
        if (itemsError) throw itemsError;
      } else {
        const { data: invoice, error } = await supabase.from("purchase_invoices").insert({ supplier_id: supplierId || null, total, paid: paidNum, payment_method: method, account_id: accountId || null, notes: notes || null }).select().single();
        if (error) throw error;
        const { error: itemsError } = await supabase.from("purchase_invoice_items").insert(lines.map((line) => ({ invoice_id: invoice.id, product_id: line.product_id, product_name: line.product_name, unit_cost: line.unit_price, quantity: line.quantity })));
        if (itemsError) throw itemsError;
      }

      toast.success(invoiceId ? "تم تحديث الفاتورة" : "تم حفظ الفاتورة");
      onSaved();
    } catch (error: any) {
      toast.error(error.message || "تعذر حفظ الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        {kind === "sales" ? <div><Label>اسم العميل</Label><Input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="مثال: محمد أحمد" /></div> : <div><Label>المورد</Label><Select value={supplierId} onValueChange={setSupplierId}><SelectTrigger><SelectValue placeholder="اختر مورد" /></SelectTrigger><SelectContent>{(suppliers ?? []).map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}</SelectContent></Select></div>}
        <div><Label>طريقة الدفع</Label><Select value={method} onValueChange={(value) => setMethod(value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAY_METHODS.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>الخزنة</Label><Select value={accountId || "__none__"} onValueChange={(value) => setAccountId(value === "__none__" ? "" : value)}><SelectTrigger><SelectValue placeholder="اختر خزنة" /></SelectTrigger><SelectContent><SelectItem value="__none__">بدون خزنة</SelectItem>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent></Select></div>
      </div>

      <div className="border rounded-md">
        <div className="flex items-center justify-between p-2 bg-muted"><span className="font-semibold text-sm">الأصناف</span>{!lockItems && <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 me-1" />إضافة سطر</Button>}</div>
        <div className="p-2 space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end pb-2 border-b last:border-0">
              <div className="col-span-12 sm:col-span-5">
                <div className="flex items-center justify-between"><Label className="text-xs">المنتج</Label>{!lockItems && kind === "purchase" && <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setNewProductMode({ ...newProductMode, [index]: !newProductMode[index] }); updateLine(index, { product_id: null, product_name: "" }); }}>{newProductMode[index] ? "← اختر من المخزون" : "+ منتج جديد"}</button>}</div>
                {lockItems ? <Input value={line.product_name} disabled /> : newProductMode[index] ? <Input placeholder="اسم المنتج الجديد" value={line.product_name} onChange={(e) => updateLine(index, { product_name: e.target.value })} /> : <ProductCombobox products={products} value={line.product_id} onChange={(product) => updateLine(index, { product_id: product.id, product_name: product.name_ar || product.name_en, unit_price: Number(kind === "sales" ? product.price ?? 0 : product.cost ?? 0) })} />}
              </div>
              <div className="col-span-3 sm:col-span-2"><Label className="text-xs">الكمية</Label><Input type="number" min="1" value={line.quantity} disabled={lockItems} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} /></div>
              <div className="col-span-5 sm:col-span-2"><Label className="text-xs">السعر</Label><Input type="number" step="0.01" value={line.unit_price} disabled={lockItems} onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })} /></div>
              <div className="col-span-3 sm:col-span-2"><Label className="text-xs">الإجمالي</Label><div className="h-10 flex items-center font-semibold">{formatPrice(line.quantity * line.unit_price)}</div></div>
              <div className="col-span-1 flex items-end justify-end">{!lockItems && <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>
            </div>
          ))}
        </div>
      </div>

      <div><Label>ملاحظات</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" /></div>

      <div className="space-y-1 border-t pt-3">
        <div className="flex items-center justify-between text-lg font-bold"><span>الإجمالي</span><span>{formatPrice(total)}</span></div>
        <div className="flex items-center justify-between gap-3"><Label className="whitespace-nowrap">المدفوع</Label><Input className="max-w-[180px]" type="number" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0.00" /></div>
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span>المتبقي</span><span>{formatPrice(Math.max(0, total - (Number(paid) || 0)))}</span></div>
      </div>

      <Button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "..." : invoiceId ? "حفظ التعديلات" : "حفظ الفاتورة"}</Button>
    </form>
  );
}
