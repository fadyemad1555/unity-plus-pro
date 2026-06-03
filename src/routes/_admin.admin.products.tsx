import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, categories(name_en)").order("created_at", { ascending: false })).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.products}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button className="btn-primary"><Plus className="h-4 w-4 me-2" />{t.add}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? t.edit : t.add} {t.products}</DialogTitle></DialogHeader>
            <ProductForm initial={editing} onSaved={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr><th className="p-3 text-start">Image</th><th className="p-3 text-start">{t.name}</th><th className="p-3 text-start">{t.price}</th><th className="p-3 text-start">{t.stock}</th><th className="p-3 text-start">{t.actions}</th></tr>
          </thead>
          <tbody>
            {data?.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-3"><img src={p.images?.[0] || "https://placehold.co/60"} alt="" className="h-12 w-12 object-cover rounded" /></td>
                <td className="p-3 font-medium">{p.name_en}<div className="text-xs text-muted-foreground">{p.name_ar}</div></td>
                <td className="p-3">ج.م {p.price}{p.discount_percent ? <span className="ms-1 text-xs text-destructive">-{p.discount_percent}%</span> : null}</td>
                <td className="p-3"><span className={p.stock <= p.low_stock_threshold ? "text-destructive font-bold" : ""}>{p.stock}</span></td>
                <td className="p-3 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSaved }: { initial: any; onSaved: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name_en: initial?.name_en ?? "", name_ar: initial?.name_ar ?? "",
    description_en: initial?.description_en ?? "", description_ar: initial?.description_ar ?? "",
    price: initial?.price ?? 0, discount_percent: initial?.discount_percent ?? 0,
    cost: initial?.cost ?? 0, stock: initial?.stock ?? 0,
    images: (initial?.images ?? []) as string[], video_url: initial?.video_url ?? "",
    is_featured: initial?.is_featured ?? false, is_active: initial?.is_active ?? true,
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null, kind: "image" | "video") => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${kind}s/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("media").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      if (kind === "image") setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      else setForm(f => ({ ...f, video_url: urls[0] }));
      toast.success("Uploaded");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), discount_percent: Number(form.discount_percent), cost: Number(form.cost), stock: Number(form.stock) };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Saved"); onSaved(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>الاسم بالعربية</Label><Input required value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="مثال: فستان صيفي" /></div>
        <div><Label>الاسم بالإنجليزية</Label><Input required value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="e.g. Summer dress" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>الوصف بالعربية</Label><Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="وصف المنتج" /></div>
        <div><Label>الوصف بالإنجليزية</Label><Textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Description" /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><Label>السعر</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value as any })} /></div>
        <div><Label>نسبة الخصم %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value as any })} /></div>
        <div><Label>سعر التكلفة</Label><Input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value as any })} /></div>
        <div><Label>الكمية المتاحة</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value as any })} /></div>
      </div>
      <div>
        <Label>صور المنتج (يمكنك اختيار أكثر من صورة مرة واحدة)</Label>
        <Input type="file" accept="image/*" multiple onChange={e => handleUpload(e.target.files, "image")} disabled={uploading} />
        <p className="text-xs text-muted-foreground mt-1">اضغط على ✕ لحذف صورة. أول صورة هي الصورة الرئيسية.</p>
        {form.images.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {form.images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="h-20 w-20 object-cover rounded border" />
                {i === 0 && <span className="absolute top-0 start-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-ee">رئيسية</span>}
                <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute -top-2 -end-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label>فيديو المنتج (اختياري)</Label>
        <Input type="file" accept="video/*" onChange={e => handleUpload(e.target.files, "video")} disabled={uploading} />
        {form.video_url && <video src={form.video_url} controls className="mt-2 h-32" />}
      </div>
      <Button type="submit" className="btn-primary w-full" disabled={uploading}>{uploading ? "جاري الرفع..." : "حفظ المنتج"}</Button>
    </form>
  );
}

