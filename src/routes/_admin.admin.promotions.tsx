import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/_admin/admin/promotions")({ component: Promotions });

function Promotions() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const empty = { title_en: "", title_ar: "", description_en: "", description_ar: "", image_url: "", link_url: "", ends_at: "" };
  const [form, setForm] = useState(empty);
  const { data = [] } = useQuery({
    queryKey: ["promos"],
    queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("promotions").insert({ ...form, ends_at: form.ends_at || null });
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["promos"] }); }
  };
  const del = async (id: string) => { if (!confirm(t.confirmDelete)) return; await supabase.from("promotions").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["promos"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" />{t.promotions}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إضافة عرض</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>العنوان (عربي)</Label><Input required value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} placeholder="مثال: عرض الصيف" /></div>
                <div><Label>العنوان (إنجليزي)</Label><Input required value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} dir="ltr" /></div>
              </div>
              <div><Label>الوصف (عربي)</Label><Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} /></div>
              <div><Label>الوصف (إنجليزي)</Label><Textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} dir="ltr" /></div>
              <div><Label>صورة العرض</Label>
                <ImageUpload value={form.image_url} onChange={url => setForm({ ...form, image_url: url })} folder="promotions" />
              </div>
              <div><Label>رابط (اختياري)</Label><Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} dir="ltr" /></div>
              <div><Label>ينتهي في</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map(p => (
          <div key={p.id} className="bg-card rounded-lg shadow-card overflow-hidden">
            {p.image_url && <img src={p.image_url} alt="" className="w-full h-40 object-cover" />}
            <div className="p-4 space-y-1">
              <div className="font-bold">{p.title_ar}</div>
              <div className="text-sm text-muted-foreground" dir="ltr">{p.title_en}</div>
              {p.ends_at && <div className="text-xs">ينتهي: {new Date(p.ends_at).toLocaleDateString("ar-EG")}</div>}
              <Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {!data.length && <p className="text-muted-foreground col-span-full text-center p-8">لا توجد عروض بعد</p>}
      </div>
    </div>
  );
}
