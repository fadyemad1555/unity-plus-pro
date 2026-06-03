import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/_shop/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const placeOrder = useServerFn(createOrder);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<"cash"|"cod"|"visa"|"instapay"|"mastercard">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const discount = coupon?.discount ?? 0;
  const finalTotal = Math.max(subtotal - discount, 0);
  const depositNum = Math.min(Math.max(Number(depositAmount) || 0, 0), finalTotal);
  const remaining = Math.max(finalTotal - depositNum, 0);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    if (!data) { toast.error("كوبون غير صحيح"); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("الكوبون منتهي"); return; }
    if (subtotal < Number(data.min_subtotal)) { toast.error(`الحد الأدنى ج.م ${data.min_subtotal}`); return; }
    if (data.max_uses && data.uses >= data.max_uses) { toast.error("الكوبون منتهي الاستخدام"); return; }
    const disc = data.discount_type === "percent" ? subtotal * Number(data.discount_value) / 100 : Number(data.discount_value);
    setCoupon({ code: data.code, discount: Math.min(disc, subtotal) });
    toast.success(`تم تطبيق الكوبون: -ج.م ${Math.min(disc, subtotal).toFixed(2)}`);
  };

  if (!items.length) return (
    <div className="container mx-auto p-16 text-center">
      <p className="text-muted-foreground mb-4">{t.emptyCart}</p>
      <Link to="/products"><Button className="btn-primary">{t.shopNow}</Button></Link>
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const paid = depositEnabled && depositNum > 0
        ? depositNum
        : method === "cod" ? 0 : finalTotal;
      const noteParts: string[] = [];
      if (coupon) noteParts.push(`كوبون ${coupon.code}: -ج.م ${coupon.discount.toFixed(2)}.`);
      if (depositEnabled && depositNum > 0) {
        noteParts.push(`عربون مدفوع: ${depositNum.toFixed(2)}. المتبقي عند الاستلام: ${(finalTotal - depositNum).toFixed(2)}.`);
      }
      const order = await placeOrder({
        data: {
          userId: user?.id ?? null,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          total: finalTotal,
          paid,
          payment_method: method,
          status: "pending",
          notes: noteParts.join(" ") || null,
          couponCode: coupon?.code ?? null,
          items: items.map((i) => ({
            product_id: i.id,
            product_name: i.name_ar || i.name_en,
            unit_price: i.price * (1 - i.discount_percent / 100),
            quantity: i.quantity,
          })),
        },
      });

      // WhatsApp confirmation — branded greeting with full order + customer details
      const itemsList = items.map(i => `• ${i.name_ar || i.name_en} ×${i.quantity} = ج.م ${(i.price * (1 - i.discount_percent / 100) * i.quantity).toFixed(2)}`).join("\n");
      const depositLine = depositEnabled && depositNum > 0
        ? `\n💵 العربون: ج.م ${depositNum.toFixed(2)}\n📦 المتبقي عند الاستلام: ج.م ${(finalTotal - depositNum).toFixed(2)}`
        : "";
      const couponLine = coupon ? `\n🎟️ كوبون ${coupon.code}: -ج.م ${coupon.discount.toFixed(2)}` : "";
      const msg = `👋 أهلاً بك في Amira Made ${name}!\n\nشكراً لطلبك ✨\n\n📦 طلب رقم #${order.id.slice(0, 8)}\n\n${itemsList}\n\n💳 طريقة الدفع: ${method}${couponLine}${depositLine}\n\n💰 الإجمالي: ج.م ${finalTotal.toFixed(2)}\n\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n\n🙏 شكراً لتعاملك معنا!`;
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");

      clear();
      toast.success("تم استلام طلبك! تأكيد الواتساب جاهز.");
      nav({ to: "/orders" });
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ، حاول مرة أخرى");
      console.error("Order error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
      <form onSubmit={submit} className="lg:col-span-2 space-y-4 bg-card p-6 rounded-lg shadow-card">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>{t.name}</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>{t.phone}</Label><Input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        </div>
        <div><Label>{t.address}</Label><Input required value={address} onChange={e => setAddress(e.target.value)} /></div>

        <div>
          <Label className="mb-3 block">{t.paymentMethod}</Label>
          <RadioGroup value={method} onValueChange={v => setMethod(v as any)} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { v: "cod", l: t.cod }, { v: "cash", l: t.cash }, { v: "visa", l: t.visa },
              { v: "mastercard", l: t.mastercard }, { v: "instapay", l: t.instapay },
            ].map(o => (
              <label key={o.v} className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:border-primary ${method === o.v ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value={o.v} />{o.l}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="rounded-md border p-4 space-y-3 bg-muted/30">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={depositEnabled}
              onChange={e => {
                setDepositEnabled(e.target.checked);
                if (e.target.checked && !depositAmount) {
                  setDepositAmount((subtotal * 0.3).toFixed(2));
                }
              }}
            />
            <div>
              <div className="font-semibold">{t.requireDeposit}</div>
              <div className="text-xs text-muted-foreground">{t.depositHint}</div>
            </div>
          </label>
          {depositEnabled && (
            <div className="grid sm:grid-cols-2 gap-3 ps-6">
              <div>
                <Label>{t.depositAmount}</Label>
                <Input
                  type="number" min="0" step="0.01" max={subtotal}
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  required
                />
              </div>
              <div className="text-sm self-end pb-2">
                <div className="flex justify-between"><span>{t.deposit}:</span><span className="font-semibold">ج.م {depositNum.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{t.remaining}:</span><span className="font-semibold">ج.م {remaining.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={submitting} className="btn-primary w-full h-11">
          {submitting ? "Processing…" : t.placeOrder}
        </Button>
      </form>
      <aside className="bg-card rounded-lg p-5 shadow-card h-fit space-y-3">
        <h2 className="font-bold">Items ({items.length})</h2>
        <div className="space-y-2 text-sm">
          {items.map(i => <div key={i.id} className="flex justify-between"><span className="truncate">{i.name_en} ×{i.quantity}</span><span>ج.م {(i.price * (1-i.discount_percent/100) * i.quantity).toFixed(2)}</span></div>)}
        </div>
        <div className="border-t pt-3 space-y-2">
          <Label className="text-xs">{t.couponCode}</Label>
          <div className="flex gap-2">
            <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="CODE" className="h-9" />
            <Button type="button" size="sm" variant="outline" onClick={applyCoupon}>{t.apply}</Button>
          </div>
          {coupon && <Badge variant="secondary">🎟️ {coupon.code} −${coupon.discount.toFixed(2)}</Badge>}
        </div>
        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>ج.م {subtotal.toFixed(2)}</span></div>
          {coupon && <div className="flex justify-between text-success"><span>{t.discount}</span><span>−${coupon.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-1">{t.total}<span>ج.م {finalTotal.toFixed(2)}</span></div>
        </div>
        {depositEnabled && depositNum > 0 && (
          <div className="text-sm space-y-1 border-t pt-2">
            <div className="flex justify-between text-primary"><span>{t.deposit} (now)</span><span>ج.م {depositNum.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{t.remaining} (on delivery)</span><span>ج.م {remaining.toFixed(2)}</span></div>
          </div>
        )}
      </aside>
    </div>
  );
}
