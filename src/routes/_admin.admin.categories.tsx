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
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/categories")({ component: Categories });

function Categories() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name_en: "", name_ar: "", slug: "", parent_id: "" });
  const { data: cats = [] } = useQuery({
    queryKey: ["cats-admin"],
    queryFn: async () => (await supabase.from("categories").select("*").order("created_at")).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").insert({
      name_en: form.name_en, name_ar: form.name_ar,
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, "-"),
      parent_id: form.parent_id || null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setOpen(false); setForm({ name_en: "", name_ar: "", slug: "", parent_id: "" }); qc.invalidateQueries({ queryKey: ["cats-admin"] }); }
  };
  const del = async (id: string) => { await supabase.from("categories").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["cats-admin"] }); };

  // Build tree
  const roots = cats.filter((c: any) => !c.parent_id);
  const renderTree = (parent: any, depth = 0): any => {
    const children = cats.filter((c: any) => c.parent_id === parent.id);
    return (
      <div key={parent.id}>
        <div className="flex items-center justify-between p-3 border-b hover:bg-muted/50" style={{ paddingInlineStart: 12 + depth * 24 }}>
          <div className="flex items-center gap-2">
            {depth > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium">{parent.name_en}</span>
            <span className="text-muted-foreground text-sm">/ {parent.name_ar}</span>
            <span className="font-mono text-xs text-muted-foreground">({parent.slug})</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => del(parent.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
        {children.map((c: any) => renderTree(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t.categories}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.add} {t.categories}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Name (EN)</Label><Input required value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>Name (AR)</Label><Input required value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>{t.parentCategory}</Label>
                <Select value={form.parent_id || "none"} onValueChange={v => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None (top-level) —</SelectItem>
                    {cats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        {roots.map((r: any) => renderTree(r))}
        {!cats.length && <div className="p-8 text-center text-muted-foreground">No categories</div>}
      </div>
    </div>
  );
}
