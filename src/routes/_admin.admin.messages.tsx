import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/messages")({ component: Messages });

function Messages() {
  const { t } = useI18n();
  const [message, setMessage] = useState("Hi! We have great offers for you today 🎉");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { data = [] } = useQuery({
    queryKey: ["customers-msg"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders").select("customer_name, customer_phone");
      const map = new Map<string, { name: string; phone: string }>();
      (orders ?? []).forEach(o => { if (o.customer_phone) map.set(o.customer_phone, { name: o.customer_name, phone: o.customer_phone }); });
      return Array.from(map.values());
    },
  });

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const toggleAll = () => {
    const all = data.every(c => selected[c.phone]);
    const next: Record<string, boolean> = {};
    if (!all) data.forEach(c => { next[c.phone] = true; });
    setSelected(next);
  };

  const sendAll = () => {
    const targets = data.filter(c => selected[c.phone]);
    if (!targets.length) return;
    const text = encodeURIComponent(message);
    targets.forEach((c, idx) => {
      // Stagger to let browser open tabs
      setTimeout(() => {
        window.open(`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
      }, idx * 400);
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6" />{t.broadcast}</h1>
      <div className="bg-card rounded-lg p-5 shadow-card space-y-3">
        <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Message…" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">{selectedCount} selected of {data.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleAll}>Toggle all</Button>
            <Button className="btn-primary" onClick={sendAll} disabled={!selectedCount || !message.trim()}>
              <Send className="h-4 w-4 me-2" />Send via WhatsApp
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-3 w-10"></th><th className="p-3 text-start">Name</th><th className="p-3 text-start">Phone</th></tr></thead>
          <tbody>
            {data.map(c => (
              <tr key={c.phone} className="border-t">
                <td className="p-3"><Checkbox checked={!!selected[c.phone]} onCheckedChange={v => setSelected(s => ({ ...s, [c.phone]: !!v }))} /></td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.phone}</td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No customers</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
