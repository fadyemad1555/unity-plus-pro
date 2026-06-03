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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/treasury")({ component: Treasury });

function Treasury() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [newAcc, setNewAcc] = useState({ name: "", kind: "cash" });
  const [openAcc, setOpenAcc] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await supabase.from("treasury_accounts").select("*").order("created_at")).data ?? [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["treasury"],
    queryFn: async () => (await supabase.from("treasury_transactions").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("treasury_accounts").insert(newAcc);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setOpenAcc(false); setNewAcc({ name: "", kind: "cash" }); qc.invalidateQueries({ queryKey: ["accounts"] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.treasury}</h1>
          <p className="text-sm text-muted-foreground">الرصيد الإجمالي: <span className="font-bold text-primary">{formatPrice(totalBalance)}</span></p>
        </div>
        <Dialog open={openAcc} onOpenChange={setOpenAcc}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.addAccount}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.addAccount}</DialogTitle></DialogHeader>
            <form onSubmit={addAccount} className="space-y-3">
              <div><Label>{t.name}</Label><Input required value={newAcc.name} onChange={e => setNewAcc({ ...newAcc, name: e.target.value })} placeholder="Vodafone Cash" /></div>
              <div><Label>Kind</Label>
                <Select value={newAcc.kind} onValueChange={v => setNewAcc({ ...newAcc, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["cash", "bank", "wallet"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map(a => (
          <div key={a.id} className="bg-card rounded-lg p-5 shadow-card">
            <Wallet className="h-6 w-6 text-primary mb-2" />
            <div className="text-xs text-muted-foreground uppercase">{a.kind}</div>
            <div className="font-semibold">{a.name}</div>
            <div className="text-2xl font-bold mt-1">{formatPrice(a.balance)}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="deposit">
        <TabsList>
          <TabsTrigger value="deposit"><ArrowDownCircle className="h-4 w-4 me-1" />{t.deposit_action}</TabsTrigger>
          <TabsTrigger value="withdraw"><ArrowUpCircle className="h-4 w-4 me-1" />{t.withdraw_action}</TabsTrigger>
          <TabsTrigger value="transfer"><ArrowLeftRight className="h-4 w-4 me-1" />{t.transfer_action}</TabsTrigger>
        </TabsList>
        <TabsContent value="deposit"><TxForm kind="deposit" accounts={accounts} /></TabsContent>
        <TabsContent value="withdraw"><TxForm kind="withdraw" accounts={accounts} /></TabsContent>
        <TabsContent value="transfer"><TxForm kind="transfer" accounts={accounts} /></TabsContent>
      </Tabs>

      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <h3 className="p-4 font-semibold border-b">Recent transactions</h3>
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">Date</th><th className="p-3 text-start">Kind</th><th className="p-3 text-start">From → To</th><th className="p-3 text-start">{t.description}</th><th className="p-3 text-end">Amount</th><th className="p-3"></th></tr></thead>
          <tbody>
            {txs.map(tx => {
              const fromA = accounts.find(a => a.id === tx.from_account_id);
              const toA = accounts.find(a => a.id === tx.to_account_id);
              return (
                <tr key={tx.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="p-3 capitalize">{tx.kind}</td>
                  <td className="p-3">{fromA?.name ?? "—"} → {toA?.name ?? "—"}</td>
                  <td className="p-3">{tx.description}</td>
                  <td className="p-3 text-end font-bold">{formatPrice(tx.amount)}</td>
                  <td className="p-3"><TxActions tx={tx} accounts={accounts} /></td>
                </tr>
              );
            })}
            {!txs.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TxActions({ tx, accounts }: { tx: any; accounts: any[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: String(tx.amount), description: tx.description ?? "" });

  const del = async () => {
    const { error } = await supabase.from("treasury_transactions").delete().eq("id", tx.id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["treasury"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("treasury_transactions").update({ amount: Number(form.amount), description: form.description || null }).eq("id", tx.id);
    if (error) toast.error(error.message);
    else { toast.success("تم التعديل"); setOpen(false); qc.invalidateQueries({ queryKey: ["treasury"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); }
  };

  return (
    <div className="flex gap-1 justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل العملية</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>المبلغ</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><Label>الوصف</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="btn-primary w-full">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف العملية؟</AlertDialogTitle><AlertDialogDescription>سيتم عكس تأثير العملية على الخزنة. لا يمكن التراجع.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-destructive">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TxForm({ kind, accounts }: { kind: "deposit" | "withdraw" | "transfer"; accounts: any[] }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", from: "", to: "", description: "", payment_method: "cash" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      kind,
      amount: Number(form.amount),
      description: form.description || null,
      payment_method: form.payment_method,
      from_account_id: kind === "withdraw" || kind === "transfer" ? form.from : null,
      to_account_id: kind === "deposit" || kind === "transfer" ? (kind === "deposit" ? form.from : form.to) : null,
    };
    if (kind === "deposit") payload.to_account_id = form.from;
    if (kind === "deposit") payload.from_account_id = null;

    const { error } = await supabase.from("treasury_transactions").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Done"); setForm({ amount: "", from: "", to: "", description: "", payment_method: "cash" });
      qc.invalidateQueries({ queryKey: ["treasury"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); }
  };

  return (
    <form onSubmit={submit} className="bg-card rounded-lg p-5 shadow-card grid sm:grid-cols-2 gap-3 mt-3">
      <div>
        <Label>{kind === "deposit" ? "To account" : "From account"}</Label>
        <Select value={form.from} onValueChange={v => setForm({ ...form, from: v })} required>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {kind === "transfer" && (
        <div>
          <Label>To account</Label>
          <Select value={form.to} onValueChange={v => setForm({ ...form, to: v })} required>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{accounts.filter(a => a.id !== form.from).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div><Label>Amount</Label><Input type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
      <div>
        <Label>{t.paymentMethod}</Label>
        <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["cash", "visa", "mastercard", "instapay", "cod"].map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2"><Label>{t.description}</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <Button type="submit" className="btn-primary sm:col-span-2 capitalize">{kind}</Button>
    </form>
  );
}
