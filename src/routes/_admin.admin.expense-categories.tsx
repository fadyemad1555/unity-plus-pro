import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/expense-categories")({ component: ExpenseCategoriesPage });

function ExpenseCategoriesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => (await supabase.from("expense_categories").select("*").order("name")).data ?? [],
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expense_categories").insert({ name });
    if (error) { toast.error(error.message); return; }
    setName(""); setOpen(false); qc.invalidateQueries({ queryKey: ["expense-categories"] });
  };
  const del = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await supabase.from("expense_categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["expense-categories"] });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6" />أنواع المصروفات</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة نوع مصروف</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>الاسم</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: إيجار" /></div>
              <Button className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map(c => (
          <div key={c.id} className="bg-card rounded-lg p-4 shadow-card flex items-center justify-between">
            <span className="font-medium">{c.name}</span>
            <Button size="sm" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {!data.length && <p className="col-span-full text-muted-foreground text-center p-8">لا توجد أنواع بعد</p>}
      </div>
    </div>
  );
}
