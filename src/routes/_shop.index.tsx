import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ProductCard, type ProductLike } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, Headphones, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_shop/")({
  component: HomePage,
});

function HomePage() {
  const { t, lang } = useI18n();

  const banners = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(10);
      return (data ?? []) as ProductLike[];
    },
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").limit(8);
      return data ?? [];
    },
  });

  const ads = useQuery({
    queryKey: ["home-ads"],
    queryFn: async () => (await supabase.from("ads").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });
  const promotions = useQuery({
    queryKey: ["home-promotions"],
    queryFn: async () => (await supabase.from("promotions").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  return (
    <div>
      <AdsMarquee ads={ads.data ?? []} />
      <HeroCarousel banners={banners.data ?? []} />
      <PromotionsStrip promotions={promotions.data ?? []} />

      {/* Trust strip */}
      <section className="bg-card border-y">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-6">
          {[
            { icon: Truck, label: "Free shipping over $50" },
            { icon: ShieldCheck, label: "Secure payments" },
            { icon: RefreshCw, label: "Easy returns" },
            { icon: Headphones, label: "24/7 support" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
              <span className="text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {(categories.data?.length ?? 0) > 0 && (
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6">{t.categories}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.data!.map(c => (
              <Link key={c.id} to="/products" search={{ category: c.slug } as never} className="group rounded-lg bg-card shadow-card p-4 text-center hover:shadow-card-hover transition">
                <div className="aspect-square mb-2 grid place-items-center bg-muted rounded-md overflow-hidden">
                  {c.image_url
                    ? <img src={c.image_url} alt={c.name_en} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    : <span className="text-3xl">🛍️</span>}
                </div>
                <div className="text-xs font-medium line-clamp-1">{lang === "ar" ? c.name_ar : c.name_en}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t.featured}</h2>
          <Link to="/products" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
            {t.shopNow} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {featured.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : featured.data?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featured.data.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <EmptyShop />
        )}
      </section>
    </div>
  );
}

function HeroCarousel({ banners }: { banners: any[] }) {
  const { t, lang } = useI18n();
  const [i, setI] = useState(0);
  const slides = banners.length ? banners : [
    { title_en: t.heroTitle, title_ar: t.heroTitle, subtitle_en: t.heroSubtitle, subtitle_ar: t.heroSubtitle,
      image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80" },
    { title_en: "Premium tech, unbeatable prices", title_ar: "أحدث التقنيات بأسعار لا تقاوم",
      subtitle_en: "Up to 60% off select electronics.", subtitle_ar: "خصومات تصل إلى 60٪",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80" },
    { title_en: "New arrivals every week", title_ar: "وافدون جدد كل أسبوع",
      subtitle_en: "Be the first to discover the latest trends.", subtitle_ar: "كن أول من يكتشف الجديد",
      image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80" },
  ];
  useEffect(() => {
    const id = setInterval(() => setI(p => (p + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [slides.length]);
  const s = slides[i];
  return (
    <section className="relative h-[280px] sm:h-[360px] md:h-[460px] overflow-hidden">
      {slides.map((sl, idx) => (
        <div key={idx} className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}>
          <img src={sl.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-nav/85 via-nav/40 to-transparent rtl:bg-gradient-to-l" />
        </div>
      ))}
      <div className="relative container mx-auto h-full px-4 flex items-center">
        <div className="max-w-xl text-nav-foreground animate-in fade-in slide-in-from-bottom-4 duration-700" key={i}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            {lang === "ar" ? s.title_ar : s.title_en}
          </h1>
          <p className="mt-3 text-base md:text-lg opacity-90">{lang === "ar" ? s.subtitle_ar : s.subtitle_en}</p>
          <Link to="/products" className="mt-6 inline-block">
            <Button className="btn-primary px-6 h-11 text-base font-semibold">{t.shopNow}</Button>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-2 bg-white/60"}`} />
        ))}
      </div>
    </section>
  );
}

function EmptyShop() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="text-muted-foreground">No products yet. Sign in as admin to add some!</p>
      <Link to="/login" className="mt-4 inline-block">
        <Button className="btn-primary">{t.login}</Button>
      </Link>
    </div>
  );
}

function AdsMarquee({ ads }: { ads: any[] }) {
  if (!ads.length) return null;
  const loop = [...ads, ...ads];
  return (
    <div className="bg-primary/10 border-y overflow-hidden py-2">
      <div className="flex gap-8 animate-marquee whitespace-nowrap">
        {loop.map((a, i) => (
          a.link_url ? (
            <a key={i} href={a.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 shrink-0">
              {a.image_url && <img src={a.image_url} alt="" className="h-8 w-8 object-cover rounded" />}
              <span className="font-semibold text-sm">{a.title}</span>
            </a>
          ) : (
            <div key={i} className="flex items-center gap-2 shrink-0">
              {a.image_url && <img src={a.image_url} alt="" className="h-8 w-8 object-cover rounded" />}
              <span className="font-semibold text-sm">{a.title}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function PromotionsStrip({ promotions }: { promotions: any[] }) {
  const { lang } = useI18n();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (promotions.length <= 1) return;
    const id = setInterval(() => setI(p => (p + 1) % promotions.length), 4500);
    return () => clearInterval(id);
  }, [promotions.length]);
  if (!promotions.length) return null;
  const p = promotions[i];
  return (
    <section className="container mx-auto px-4 py-4">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/90 to-primary/60 text-primary-foreground shadow-card">
        <div className="flex items-center gap-4 p-5 min-h-[110px]">
          {p.image_url && <img src={p.image_url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />}
          <div className="flex-1">
            <h3 className="text-lg font-bold">{lang === "ar" ? p.title_ar : p.title_en}</h3>
            <p className="text-sm opacity-90 mt-1 line-clamp-2">{lang === "ar" ? p.description_ar : p.description_en}</p>
          </div>
          {p.link_url && <a href={p.link_url} className="text-sm font-bold bg-white text-primary px-3 py-2 rounded-md">عرض</a>}
        </div>
        {promotions.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
            {promotions.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
