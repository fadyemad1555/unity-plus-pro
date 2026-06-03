import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_shop/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQty, subtotal } = useCart();
  const { t, lang } = useI18n();

  if (!items.length) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-lg text-muted-foreground mb-6">{t.emptyCart}</p>
      <Link to="/products"><Button className="btn-primary">{t.shopNow}</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-2xl font-bold">{t.cart}</h1>
        {items.map(it => {
          const final = it.price * (1 - it.discount_percent / 100);
          return (
            <div key={it.id} className="flex gap-4 p-3 bg-card rounded-lg shadow-card">
              <img src={it.image} alt="" className="h-24 w-24 object-cover rounded-md" />
              <div className="flex-1">
                <Link to="/products/$id" params={{ id: it.id }} className="font-medium hover:text-primary">
                  {lang === "ar" ? it.name_ar : it.name_en}
                </Link>
                <div className="text-lg font-bold mt-1">ج.م {final.toFixed(2)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center border rounded">
                    <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-3 py-1">-</button>
                    <span className="px-3">{it.quantity}</span>
                    <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-3 py-1">+</button>
                  </div>
                  <button onClick={() => remove(it.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <aside className="bg-card rounded-lg p-5 shadow-card h-fit">
        <h2 className="font-bold text-lg mb-3">Order summary</h2>
        <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>ج.م {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm mb-2"><span>Shipping</span><span className="text-success">Free</span></div>
        <div className="flex justify-between text-lg font-bold pt-3 border-t">{t.total}<span>ج.م {subtotal.toFixed(2)}</span></div>
        <Link to="/checkout"><Button className="w-full mt-4 btn-primary">{t.placeOrder}</Button></Link>
      </aside>
    </div>
  );
}
