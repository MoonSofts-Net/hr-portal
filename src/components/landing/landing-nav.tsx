"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LANDING_NAV_HREFS } from "@/lib/landing/content";
import { useTranslations } from "@/hooks/use-translations";

export function LandingNav() {
  const { t } = useTranslations();
  const menuId = useId();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMobile]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMobile();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMobile]);

  return (
    <header
      className={cn(
        "landing-nav-bar fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300 motion-safe:animate-landing-nav-in",
        scrolled
          ? "border-border bg-card/95 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-card/90"
          : "border-transparent bg-card"
      )}
    >
      <div
        className={cn(
          "landing-nav-inner mx-auto flex max-w-[1200px] items-center justify-between gap-[12px] sm:gap-[16px]",
          "px-[16px] sm:px-[20px] lg:px-[28px] xl:max-w-[1280px]"
        )}
      >
        <BrandLogo
          href="/"
          size="sm"
          subtitle={t("brand.portalSubtitle")}
          className="shrink-0 pt-[8px] sm:pt-[10px] lg:pt-[12px]"
          logoClassName="max-h-[32px] min-[480px]:max-h-[38px] sm:max-h-[42px] lg:max-h-[44px]"
          subtitleClassName="hidden min-[480px]:block max-w-[120px] min-[640px]:max-w-none"
        />

        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-[24px] xl:gap-[32px]"
          aria-label={t("landing.nav.ariaLabel")}
        >
          {LANDING_NAV_HREFS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="landing-nav-link whitespace-nowrap text-[13px] xl:text-[14px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))]"
            >
              {t(`landing.nav.${item.key}`)}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex shrink-0 items-center gap-[8px] xl:gap-[10px]">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="font-medium text-[13px] xl:text-[14px]">
            <Link href="/login">{t("landing.actions.signIn")}</Link>
          </Button>
          <Button
            asChild
            className="bg-[hsl(var(--brand-red))] text-[13px] xl:text-[14px] transition-all duration-300 hover:bg-[hsl(var(--brand-red)/0.92)] hover:-translate-y-[1px] active:translate-y-0"
          >
            <Link href="/login">{t("landing.actions.accessPortal")}</Link>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-[6px] sm:gap-[8px] lg:hidden">
          <Button variant="ghost" asChild className="hidden md:inline-flex font-medium text-[13px] px-[10px]">
            <Link href="/login">{t("landing.actions.signIn")}</Link>
          </Button>
          <LanguageSwitcher className="scale-[0.92] sm:scale-100 origin-right" />
          <Button
            variant="ghost"
            size="icon"
            className="h-[40px] w-[40px] sm:h-[44px] sm:w-[44px]"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={mobileOpen ? t("landing.nav.closeMenu") : t("landing.nav.openMenu")}
          >
            {mobileOpen ? (
              <PlatformIcons.close className="h-5 w-5" />
            ) : (
              <PlatformIcons.menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div
        id={menuId}
        className={cn(
          "lg:hidden overflow-hidden border-t border-border bg-card transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0 border-transparent"
        )}
        aria-hidden={!mobileOpen}
      >
        <nav
          className="flex flex-col gap-[2px] p-[12px] sm:p-[16px] pb-[max(16px,env(safe-area-inset-bottom))]"
          aria-label={t("landing.nav.mobileAriaLabel")}
        >
          {LANDING_NAV_HREFS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-[12px] py-[11px] sm:py-[12px] text-[14px] font-medium text-[hsl(var(--brand-navy))] transition-colors hover:bg-muted active:bg-muted/80"
              onClick={closeMobile}
            >
              {t(`landing.nav.${item.key}`)}
            </a>
          ))}
          <div className="mt-[8px] flex flex-col gap-[8px] border-t border-border pt-[12px] sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/login" onClick={closeMobile}>
                {t("landing.actions.signIn")}
              </Link>
            </Button>
          </div>
          <div className="mt-[8px] flex flex-col gap-[8px] border-t border-border pt-[12px]">
            <Button asChild className="w-full bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red)/0.92)]">
              <Link href="/login" onClick={closeMobile}>
                {t("landing.actions.accessPortal")}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
