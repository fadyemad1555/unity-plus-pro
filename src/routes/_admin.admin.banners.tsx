import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/banners")({ component: Banners });

function Banners() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "", image_url: "", link_url: "", sort_order: 0 });
  const { data } = useQuery({ queryKey: ["banners-admin"], queryFn: async () => (await supabase.from("banners").select("*").order("sort_order")).data ?? [] });

  const upload = async (file: File) => {
    const path = `banners/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); return; }
    setForm(f => ({ ...f, image_url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl }));
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("banners").insert({ ...form, sort_order: Number(form.sort_order) });
    if (error) toast.error(error.message); else { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["banners-admin"] }); }
  };
  const del = async (id: string) => { await supabase.from("banners").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["banners-admin"] }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.banners}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.add} Banner</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Title (EN)</Label><Input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} /></div>
                <div><Label>Title (AR)</Label><Input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} /></div>
              </div>
              <div><Label>Image</Label><Input type="file" accept="image/*" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} /></div>
              {form.image_url && <img src={form.image_url} className="h-24 rounded" />}
              <Button type="submit" className="btn-primary w-full">{t.save}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data?.map(b => (
          <div key={b.id} className="bg-card rounded-lg shadow-card overflow-hidden">
            <img src={b.image_url} className="w-full h-40 object-cover" />
            <div className="p-3 flex justify-between items-center">
              <div className="font-medium">{b.title_en}</div>
              <Button size="sm" variant="ghost" onClick={() => del(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
