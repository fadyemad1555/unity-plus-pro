import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shop/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  if (!user) return (
    <div className="container mx-auto p-16 text-center">
      <p className="mb-4">Please sign in.</p>
      <Link to="/login"><Button className="btn-primary">{t.login}</Button></Link>
    </div>
  );
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t.account}</h1>
      <div className="bg-card rounded-lg p-6 shadow-card space-y-3">
        <div><div className="text-xs text-muted-foreground">{t.email}</div><div className="font-medium">{user.email}</div></div>
        <div><div className="text-xs text-muted-foreground">User ID</div><div className="font-mono text-xs">{user.id}</div></div>
        <Button variant="outline" onClick={() => signOut()}>{t.logout}</Button>
      </div>
    </div>
  );
}
