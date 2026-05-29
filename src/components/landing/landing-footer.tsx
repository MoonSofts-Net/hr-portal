import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { LANDING_NAV } from "@/lib/landing/content";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Modules", href: "#modules" },
    { label: "Security", href: "#security" },
  ],
  Portal: [
    { label: "Sign in", href: "/login" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reset password", href: "/forgot-password" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border/80 bg-card">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px] py-[56px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[40px]">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-[12px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <PlatformIcons.shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Portal RH</span>
            </Link>
            <p className="mt-[16px] text-sm text-muted-foreground leading-relaxed max-w-sm">
              Corporate HR self-service portal for onboarding, documents, communication,
              time mirror, and compliance — scalable for multi-company SaaS.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-[16px]">{title}</h4>
              <ul className="space-y-[10px]">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[48px] pt-[24px] border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-[16px]">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Portal RH · Moonsofts HR Platform V1
          </p>
          <nav className="flex flex-wrap gap-[20px]">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
