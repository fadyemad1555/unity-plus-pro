import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductLike } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

type Search = { q?: string; category?: string; sort?: string };

export const Route = createFileRoute("/_shop/products")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search.category, search.sort],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(slug)").eq("is_active", true);
      if (search.category) query = query.eq("categories.slug", search.category);
      if (search.sort === "deals") query = query.gt("discount_percent", 0);
      const { data } = await query.order("created_at", { ascending: false });
      return (data ?? []) as ProductLike[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.toLowerCase().trim();
    if (!term) return data;
    return data.filter(p =>
      p.name_en.toLowerCase().includes(term) || p.name_ar.includes(q)
    );
  }, [data, q]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.products}</h1>
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} className="sm:w-80" />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-20">No products found.</p>
      )}
    </div>
  );
}
