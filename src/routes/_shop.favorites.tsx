import { createFileRoute, Link } from "@tanstack/react-router";
import { useFavorites } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductLike } from "@/components/ProductCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shop/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["fav-products", ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const { data } = await supabase.from("products").select("*").in("id", ids);
      return (data ?? []) as ProductLike[];
    },
  });

  if (!ids.length) return (
    <div className="container mx-auto p-16 text-center">
      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-lg text-muted-foreground mb-6">{t.emptyFavorites}</p>
      <Link to="/products"><Button className="btn-primary">{t.shopNow}</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t.favorites}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.map(p => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
