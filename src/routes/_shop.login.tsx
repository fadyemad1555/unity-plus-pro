import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ensureAdmin, ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin-bootstrap.functions";

export const Route = createFileRoute("/_shop/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Bootstrap admin once on mount (idempotent)
  useEffect(() => { ensureAdmin().catch(() => {}); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Map "Admin" username → admin email (case-insensitive)
      let email = identifier;
      let pwd = password;
      if (identifier.trim().toLowerCase() === "admin") {
        email = ADMIN_EMAIL;
        if (password === "Admin") pwd = ADMIN_PASSWORD; // accept "Admin" shortcut
      }
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        toast.success(t.welcome);
        nav({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created!");
        nav({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-card-hover p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground font-black">S</div>
          <span className="font-bold text-xl">{t.brand}</span>
        </Link>

        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">{t.login}</TabsTrigger>
            <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
          </TabsList>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <TabsContent value="signup" className="m-0">
              <div className="space-y-2">
                <Label>{t.name}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required={tab === "signup"} />
              </div>
            </TabsContent>
            <div className="space-y-2">
              <Label>{tab === "signin" ? t.username : t.email}</Label>
              <Input value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={tab === "signin" ? "Admin or your@email.com" : "your@email.com"} />
            </div>
            <div className="space-y-2">
              <Label>{t.password}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="btn-primary w-full h-11">
              {loading ? "…" : tab === "signin" ? t.login : t.signUp}
            </Button>
          </form>
        </Tabs>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          Admin demo: <span className="font-mono font-semibold">Admin</span> / <span className="font-mono font-semibold">Admin</span>
        </p>
      </div>
    </div>
  );
}
