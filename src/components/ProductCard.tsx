import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useFavorites, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";


export type ProductLike = {
  id: string; name_en: string; name_ar: string;
  price: number; discount_percent: number;
  images: string[]; stock: number;
};

export function ProductCard({ p }: { p: ProductLike }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const { has, toggle } = useFavorites();
  const name = lang === "ar" ? p.name_ar : p.name_en;
  const final = p.price * (1 - p.discount_percent / 100);
  const img = p.images[0] || "https://placehold.co/400x400/eee/333?text=No+Image";

  return (
    <div className="group relative rounded-lg bg-card shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      <button
        onClick={() => toggle(p.id)}
        aria-label="favorite"
        className={`absolute top-2 end-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur ${has(p.id) ? "text-destructive" : "text-muted-foreground"} hover:scale-110 transition-transform`}
      >
        <Heart className="h-4 w-4" fill={has(p.id) ? "currentColor" : "none"} />
      </button>
      <Link to="/products/$id" params={{ id: p.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img src={img} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          <img src={logo} alt="Amira Made" className="absolute bottom-2 start-2 h-8 w-8 rounded-full border border-white shadow object-cover bg-white" />
        </div>
      </Link>
      <div className="p-3 space-y-2">
        <Link to="/products/$id" params={{ id: p.id }} className="block font-medium text-sm line-clamp-2 hover:text-primary">{name}</Link>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatPrice(final)}</span>
          {p.discount_percent > 0 && <span className="text-xs line-through text-muted-foreground">{formatPrice(p.price)}</span>}
          {p.discount_percent > 0 && <span className="text-xs font-semibold text-destructive">-{p.discount_percent}%</span>}
        </div>

        <div className="text-xs text-muted-foreground">{p.stock > 0 ? t.inStock : t.outOfStock}</div>
        <Button
          size="sm"
          disabled={p.stock <= 0}
          className="w-full btn-primary"
          onClick={() => add({ id: p.id, name_en: p.name_en, name_ar: p.name_ar, price: p.price, discount_percent: p.discount_percent, image: img })}
        >
          {t.addToCart}
        </Button>
      </div>
    </div>
  );
}
