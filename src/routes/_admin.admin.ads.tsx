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
import { Plus, Trash2, MonitorSpeaker } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/_admin/admin/ads")({ component: Ads });

function Ads() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", link_url: "", placement: "home" });
  const { data = [] } = useQuery({
    queryKey: ["ads"],
    queryFn: async () => (await supabase.from("ads").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error("ارفع صورة أو ضع رابط"); return; }
    const { error } = await supabase.from("ads").insert(form);
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); setOpen(false); setForm({ title: "", image_url: "", link_url: "", placement: "home" }); qc.invalidateQueries({ queryKey: ["ads"] }); }
  };
  const del = async (id: string) => { if (!confirm(t.confirmDelete)) return; await supabase.from("ads").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["ads"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MonitorSpeaker className="h-6 w-6" />{t.ads}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة إعلان</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>عنوان الإعلان</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: تخفيضات الصيف" /></div>
              <div><Label>صورة الإعلان</Label>
                <ImageUpload value={form.image_url} onChange={url => setForm({ ...form, image_url: url })} folder="ads" />
              </div>
              <div><Label>رابط عند الضغط (اختياري)</Label><Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} dir="ltr" /></div>
              <div><Label>مكان الظهور</Label>
                <Select value={form.placement} onValueChange={v => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[["home","الرئيسية"],["sidebar","الجانب"],["product","صفحة المنتج"]].map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map(a => (
          <div key={a.id} className="bg-card rounded-lg shadow-card overflow-hidden">
            <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{a.title}</div>
                <div className="text-xs text-muted-foreground uppercase">{a.placement}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {!data.length && <p className="text-muted-foreground col-span-full text-center p-8">لا توجد إعلانات بعد</p>}
      </div>
    </div>
  );
}
