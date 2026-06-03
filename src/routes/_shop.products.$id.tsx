import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart, useFavorites } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Truck, ShieldCheck, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.jpeg";


export const Route = createFileRoute("/_shop/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container mx-auto p-8 animate-pulse">Loading…</div>;
  if (!p) return <div className="container mx-auto p-8">Product not found.</div>;

  const name = lang === "ar" ? p.name_ar : p.name_en;
  const desc = lang === "ar" ? p.description_ar : p.description_en;
  const final = p.price * (1 - p.discount_percent / 100);
  const images = (p.images?.length ? p.images : ["https://placehold.co/600x600/eee/333?text=No+Image"]) as string[];

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setImgIdx(i => (i + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm mb-4 text-muted-foreground">
        <Link to="/" className="hover:text-primary">{t.home}</Link> / <Link to="/products" className="hover:text-primary">{t.products}</Link> / <span>{name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img src={images[imgIdx]} alt={name} className="h-full w-full object-cover" />
            <img src={logo} alt="Amira Made" className="absolute top-3 start-3 h-14 w-14 rounded-full border-2 border-white shadow-lg object-cover bg-white" />
            <div className="absolute bottom-3 end-3 bg-white p-1.5 rounded-md shadow-lg">
              <QRCodeSVG value={typeof window !== "undefined" ? window.location.href : `/products/${p.id}`} size={56} />
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`shrink-0 h-20 w-20 rounded-md overflow-hidden border-2 ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {p.video_url && (
            <video src={p.video_url} controls className="mt-4 w-full rounded-lg" />
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">ج.م {final.toFixed(2)}</span>
            {p.discount_percent > 0 && (
              <>
                <span className="text-lg line-through text-muted-foreground">ج.م {p.price.toFixed(2)}</span>
                <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded">-{p.discount_percent}%</span>
              </>
            )}
          </div>
          <p className={`text-sm font-semibold ${p.stock > 0 ? "text-success" : "text-destructive"}`}>
            {p.stock > 0 ? `${t.inStock} (${p.stock})` : t.outOfStock}
          </p>

          {desc && <p className="text-muted-foreground leading-relaxed">{desc}</p>}

          <div className="flex items-center gap-3">
            <label className="text-sm">{t.quantity}:</label>
            <div className="flex items-center border rounded-md">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1.5">-</button>
              <span className="px-4 font-semibold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(p.stock || 99, q + 1))} className="px-3 py-1.5">+</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              size="lg" disabled={p.stock <= 0}
              onClick={() => {
                add({ id: p.id, name_en: p.name_en, name_ar: p.name_ar, price: p.price, discount_percent: p.discount_percent, image: images[0] }, qty);
                toast.success(t.addToCart);
              }}
              className="btn-primary flex-1"
            >
              <ShoppingCart className="h-4 w-4 me-2" />{t.addToCart}
            </Button>
            <Button size="lg" variant="outline" onClick={() => toggle(p.id)}>
              <Heart className={`h-5 w-5 ${has(p.id) ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm"><Truck className="h-5 w-5 text-primary" /> Fast delivery</div>
            <div className="flex items-center gap-2 text-sm"><ShieldCheck className="h-5 w-5 text-primary" /> Secure payment</div>
          </div>

          <div className="pt-4 border-t flex items-start gap-4">
            <div className="bg-white p-2 rounded-md">
              <QRCodeSVG value={typeof window !== "undefined" ? window.location.href : `/products/${p.id}`} size={96} />
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold text-foreground"><QrCode className="h-4 w-4" /> Scan to share</div>
              <p>Scan this code to open the product page on any device.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
