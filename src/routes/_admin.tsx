import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Users, Wallet,
  BarChart3, ImageIcon, Tags, Sun, Moon, Globe, LogOut, Home,
  Ticket, Megaphone, MonitorSpeaker, Receipt, AlertTriangle, UserCheck, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: s => s.location.pathname });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/login" });
  }, [user, isAdmin, loading, nav]);

  if (loading || !user || !isAdmin) return <div className="p-8">Loading…</div>;

  const links = [
    { to: "/admin", label: t.dashboard, icon: LayoutDashboard },
    { to: "/admin/products", label: t.products, icon: Package },
    { to: "/admin/categories", label: t.categories, icon: Tags },
    { to: "/admin/orders", label: t.orders, icon: ShoppingCart },
    { to: "/admin/sales", label: t.sales, icon: Receipt },
    { to: "/admin/purchases", label: t.purchases, icon: Receipt },
    { to: "/admin/inventory", label: t.inventory, icon: Warehouse },
    { to: "/admin/suppliers", label: t.suppliers, icon: Users },
    { to: "/admin/customers", label: t.customers, icon: UserCheck },
    { to: "/admin/users", label: t.users, icon: Users },
    { to: "/admin/treasury", label: t.treasury, icon: Wallet },
    { to: "/admin/expenses", label: t.expenses, icon: Receipt },
    { to: "/admin/expense-categories", label: "أنواع المصروفات", icon: Tags },
    { to: "/admin/damaged", label: t.damaged, icon: AlertTriangle },
    { to: "/admin/coupons", label: t.coupons, icon: Ticket },
    { to: "/admin/promotions", label: t.promotions, icon: Megaphone },
    { to: "/admin/ads", label: t.ads, icon: MonitorSpeaker },
    { to: "/admin/messages", label: t.broadcast, icon: MessageCircle },
    { to: "/admin/banners", label: t.banners, icon: ImageIcon },
    { to: "/admin/reports", label: t.reports, icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden lg:flex flex-col w-64 nav-bar text-nav-foreground sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-black">S</div>
          <span className="font-bold">{t.brand} <span className="opacity-60 text-xs">/ {t.admin}</span></span>
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(l => {
            const active = path === l.to;
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-white/10"}`}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/10">
            <Home className="h-4 w-4" />Storefront
          </Link>
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/10">
            <LogOut className="h-4 w-4" />{t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-card border-b flex items-center justify-between px-4 sm:px-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-black">S</div>
            <span className="font-bold">{t.admin}</span>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              <Globe className="h-4 w-4 me-1" />{lang === "en" ? "AR" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile nav scroll */}
        <div className="lg:hidden bg-card border-b overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {links.map(l => {
              const active = path === l.to;
              return (
                <Link key={l.to} to={l.to} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <l.icon className="h-3.5 w-3.5" />{l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
