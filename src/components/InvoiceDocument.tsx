import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import logo from "@/assets/logo.jpeg";

export type InvoiceLine = { product_name: string; quantity: number; unit_price: number };

export function InvoiceDocument({
  kind, id, partyName, partyPhone, date, lines, total, paid, paymentMethod, accountName, notes,
}: {
  kind: "sales" | "purchase";
  id: string;
  partyName: string;
  partyPhone?: string;
  date: string;
  lines: InvoiceLine[];
  total: number;
  paid: number;
  paymentMethod: string;
  accountName?: string;
  notes?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [waPhone, setWaPhone] = useState(partyPhone || "");
  const remaining = total - paid;

  const captureBlob = async (): Promise<Blob | null> => {
    if (!ref.current) return null;
    // html-to-image handles oklch/modern CSS via SVG foreignObject and won't crash.
    // Inline styles on the captured node guarantee deterministic colors regardless of theme.
    const dataUrl = await toPng(ref.current, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
      style: { background: "#ffffff", color: "#000000" },
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const shareWhatsApp = async () => {
    const t = toast.loading("جاري تحضير الصورة...");
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error("فشل تصدير الصورة");
      const path = `invoices/${kind}-${id}-${Date.now()}.png`;
      const { error } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/png", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const phoneTarget = waPhone ? waPhone.replace(/[^0-9]/g, "") : "";
      const label = kind === "sales" ? "فاتورة مبيعات" : "فاتورة مشتريات";
      const msg = `🧾 Amira Made — ${label}\n#${id.slice(0, 8)}\n\nالعميل: ${partyName}\nالإجمالي: ${formatPrice(total)}\nالمدفوع: ${formatPrice(paid)}\nالمتبقي: ${formatPrice(remaining)}\n\n📎 ${data.publicUrl}`;
      window.open(`https://wa.me/${phoneTarget}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success("تم التحضير ✓", { id: t });
    } catch (e: any) {
      console.error("WhatsApp share error:", e);
      toast.error(e.message || "فشل الإرسال", { id: t });
    }
  };

  return (
    <div className="space-y-3">
      <div ref={ref} className="bg-white text-black p-6 rounded-md border" dir="rtl">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Amira Made" className="h-14 w-14 rounded-md object-cover border" crossOrigin="anonymous" />
            <div>
              <div className="text-2xl font-black">Amira Made</div>
              <div className="text-xs text-gray-500">{kind === "sales" ? "فاتورة مبيعات" : "فاتورة مشتريات"}</div>
            </div>
          </div>
          <div className="text-end text-xs text-gray-600">
            <div>#{id.slice(0, 8)}</div>
            <div>{new Date(date).toLocaleString("ar-EG")}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div><span className="text-gray-500">الاسم:</span> <span className="font-semibold">{partyName}</span></div>
          {partyPhone && <div><span className="text-gray-500">الهاتف:</span> <span dir="ltr">{partyPhone}</span></div>}
          <div><span className="text-gray-500">طريقة الدفع:</span> <span className="font-semibold">{paymentMethod}</span></div>
          {accountName && <div><span className="text-gray-500">الخزنة:</span> <span>{accountName}</span></div>}
        </div>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="p-2 text-start border">الصنف</th><th className="p-2 border">الكمية</th><th className="p-2 border">السعر</th><th className="p-2 border">الإجمالي</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}><td className="p-2 border">{l.product_name}</td><td className="p-2 border text-center">{l.quantity}</td><td className="p-2 border text-center">{formatPrice(l.unit_price)}</td><td className="p-2 border text-center font-semibold">{formatPrice(l.quantity * l.unit_price)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 ms-auto w-full sm:w-72 space-y-1 text-sm">
          <div className="flex justify-between border-t pt-2"><span className="font-bold">الإجمالي</span><span className="font-bold">{formatPrice(total)}</span></div>
          <div className="flex justify-between"><span>المدفوع</span><span>{formatPrice(paid)}</span></div>
          <div className="flex justify-between text-red-600"><span>المتبقي</span><span>{formatPrice(remaining)}</span></div>
        </div>
        {notes && <div className="text-xs text-gray-500 mt-3 border-t pt-2">ملاحظات: {notes}</div>}
        <div className="text-center text-xs text-gray-400 mt-4 pt-2 border-t">شكراً لتعاملكم مع Amira Made</div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">رقم واتساب:</label>
          <Input dir="ltr" value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="01xxxxxxxxx" className="flex-1" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} variant="outline" className="flex-1"><Printer className="h-4 w-4 me-2" />طباعة</Button>
          <Button onClick={shareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="h-4 w-4 me-2" />إرسال واتساب</Button>
        </div>
      </div>
    </div>
  );
}
