import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ImageUpload({
  value, onChange, folder = "uploads", label = "رفع صورة",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("تم الرفع");
    } catch (err: any) {
      toast.error(err.message || "فشل الرفع");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-card hover:bg-muted cursor-pointer text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{label}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={busy} />
        </label>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="أو الصق رابط الصورة" dir="ltr" />
      {value && <img src={value} alt="" className="h-32 rounded-md border object-cover" />}
    </div>
  );
}
