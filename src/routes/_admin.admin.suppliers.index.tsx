import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_admin/admin/suppliers/")({ component: Suppliers });

function Suppliers() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  const { data } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("suppliers").insert(form);
    if (error) toast.error(error.message); else { toast.success("Added"); setOpen(false); setForm({ name: "", phone: "", email: "", address: "" }); qc.invalidateQueries({ queryKey: ["suppliers"] }); }
  };
  const del = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await supabase.from("suppliers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["suppliers"] });
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.suppliers}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.add} {t.suppliers}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>{t.name}</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>{t.phone}</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>{t.address}</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 text-start">{t.name}</th><th className="p-3 text-start">{t.phone}</th><th className="p-3 text-start">Email</th><th className="p-3 text-start">{t.actions}</th></tr></thead>
          <tbody>
            {data?.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.phone}</td>
                <td className="p-3">{s.email}</td>
                <td className="p-3 flex gap-1">
                  <Link to="/admin/suppliers/$id" params={{ id: s.id }}>
                    <Button size="sm" variant="ghost"><FileText className="h-4 w-4 text-primary" /></Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>

              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No suppliers</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
