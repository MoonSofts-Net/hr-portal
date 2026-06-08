"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Reveal } from "@/components/landing/reveal";
import { BRAND, LANDING_NAV_HREFS } from "@/lib/landing/content";
import { useTranslations } from "@/hooks/use-translations";

export function LandingFooter() {
  const { t } = useTranslations();

  const portalLinks = [
    { label: t("landing.footer.enter"), href: "/login" },
    { label: t("landing.footer.dashboard"), href: "/dashboard" },
    { label: t("landing.footer.resetPassword"), href: "/forgot-password" },
  ];

  const institutionalLinks = [
    { label: t("landing.footer.officialSite"), href: BRAND.website, external: true },
    { label: t("landing.footer.aboutUs"), href: BRAND.institutionalUrl, external: true },
    { label: t("landing.footer.portalResources"), href: "#features" },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px] py-[48px]">
        <Reveal animation="up" duration={700}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[40px]">
            <div className="lg:col-span-2">
              <BrandLogo href="/" size="sm" subtitle={t("brand.portalSubtitle")} />
              <p className="mt-[16px] text-[14px] text-[hsl(var(--muted-foreground))] leading-[1.65] max-w-sm">
                {BRAND.name} {BRAND.tagline} — {t("landing.footer.description")}
              </p>
              <div className="mt-[20px] space-y-[4px] text-[14px] text-[hsl(var(--muted-foreground))]">
                <p>{BRAND.phone}</p>
                <p>{BRAND.whatsapp}</p>
                <p>{BRAND.email}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold mb-[14px] text-[hsl(var(--brand-navy))]">
                {t("landing.footer.portal")}
              </h4>
              <ul className="space-y-[8px]">
                {portalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold mb-[14px] text-[hsl(var(--brand-navy))]">
                {t("landing.footer.institutional")}
              </h4>
              <ul className="space-y-[8px]">
                {institutionalLinks.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))] transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[14px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))] transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-[40px] pt-[24px] border-t border-border flex flex-col sm:flex-row items-center justify-between gap-[12px]">
          <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} {BRAND.name} · {t("landing.footer.copyright")}
          </p>
          <nav className="flex flex-wrap gap-[16px]">
            {LANDING_NAV_HREFS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))]"
              >
                {t(`landing.nav.${item.key}`)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
