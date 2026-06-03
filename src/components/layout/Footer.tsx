import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { MessageCircle, Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const SOCIALS = {
  facebook: "https://www.facebook.com/share/1EnmoMdD4f/",
  instagram: "https://www.instagram.com/amiramade20?igsh=MWo2OWdmeDZ5N3pkcA==",
  tiktok: "https://www.tiktok.com/@amiramade1?_r=1&_t=ZS-96R0DDF1yRI",
  whatsapp: "https://wa.me/201000000000",
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.7 20.1a6.34 6.34 0 0 0 10.86-4.43V9.01a8.16 8.16 0 0 0 4.77 1.52V7.09a4.85 4.85 0 0 1-1.74-.4Z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <>
      <footer className="mt-16 nav-bar">
        <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src={logo} alt="Amira Made" className="h-11 w-11 rounded-md object-cover bg-white" />
              <span className="font-bold text-lg">{t.brand}</span>
            </div>
            <p className="text-sm opacity-80 mb-4">Gift Designer — Made with love.</p>
            <div className="flex items-center gap-2">
              <a href={SOCIALS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={SOCIALS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors">
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a href={SOCIALS.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                 className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-[#25D366] hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
          <FooterCol title="Get to know us" links={["About", "Careers", "Press"]} />
          <FooterCol title="Customer service" links={[t.account, t.orders, "Returns", "Help"]} />
          <FooterCol title="Pay with" links={["Visa", "Mastercard", "InstaPay", t.cod]} />
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
          © {new Date().getFullYear()} {t.brand}. All rights reserved.
        </div>
      </footer>
      <a
        href={SOCIALS.whatsapp}
        target="_blank" rel="noreferrer"
        aria-label={t.whatsappSupport}
        className="fixed bottom-5 end-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card-hover hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-sm opacity-80">
        {links.map(l => <li key={l}><Link to="/" className="hover:text-primary">{l}</Link></li>)}
      </ul>
    </div>
  );
}
