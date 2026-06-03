import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShoppingCart, Heart, User as UserIcon, Sun, Moon, Globe, Menu, LogOut, LayoutDashboard, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.jpeg";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const path = useRouterState({ select: s => s.location.pathname });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { q } as never });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top nav */}
      <div className="nav-bar">
        <div className="container mx-auto flex items-center gap-3 px-3 py-2">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Amira Made" className="h-10 w-10 rounded-md object-cover bg-white" />
            <span className="hidden sm:block font-bold tracking-tight text-lg">{t.brand}</span>
          </Link>

          <form onSubmit={onSearch} className="hidden md:flex flex-1 mx-4 max-w-3xl">
            <div className="flex w-full overflow-hidden rounded-md ring-2 ring-transparent focus-within:ring-primary">
              <input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder={t.search}
                className="flex-1 px-4 py-2 text-foreground bg-background focus:outline-none"
              />
              <button type="submit" className="px-5 bg-primary text-primary-foreground hover:brightness-105">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-nav-foreground hover:bg-white/10">
              <Globe className="h-4 w-4 me-1" />{lang === "en" ? "AR" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} className="text-nav-foreground hover:bg-white/10">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link to="/favorites" className="hidden sm:inline-flex p-2 hover:bg-white/10 rounded-md">
              <Heart className="h-5 w-5" />
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-white/10 rounded-md">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{count}</span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-md inline-flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                        <LayoutDashboard className="h-4 w-4 me-2" />{t.dashboard}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
                      <UserIcon className="h-4 w-4 me-2" />{t.account}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                      <Package className="h-4 w-4 me-2" />{t.orders}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 me-2" />{t.logout}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>
                    <UserIcon className="h-4 w-4 me-2" />{t.login}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub nav */}
        <div className="nav-sub">
          <div className="container mx-auto flex items-center gap-1 px-3 py-1.5 text-sm overflow-x-auto">
            <Menu className="h-4 w-4 me-2 opacity-80" />
            {[
              { to: "/", label: t.home },
              { to: "/products", label: t.products },
              { to: "/products", label: t.deals, search: { sort: "deals" } },
              { to: "/orders", label: t.orders },
            ].map((l, i) => (
              <Link key={i} to={l.to} search={l.search as never} className={`px-3 py-1 rounded hover:bg-white/10 whitespace-nowrap ${path === l.to ? "bg-white/10" : ""}`}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* mobile search */}
      <form onSubmit={onSearch} className="md:hidden p-2 bg-nav-sub">
        <div className="flex overflow-hidden rounded-md bg-background">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} className="flex-1 px-3 py-2 text-foreground focus:outline-none" />
          <button type="submit" className="px-4 bg-primary text-primary-foreground"><Search className="h-4 w-4" /></button>
        </div>
      </form>
    </header>
  );
}
