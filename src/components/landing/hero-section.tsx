"use client";

import Image from "next/image";
import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { BRAND } from "@/lib/landing/content";
import { useTranslations } from "@/hooks/use-translations";

export function HeroSection() {
  const { t, messages } = useTranslations();
  const highlights = messages.landing.hero.highlights;
  const visionContent = t("landing.institutional.pillars.visao.content");

  return (
    <section className="pt-nav-offset pb-[56px] sm:pb-[72px] lg:pb-[88px] bg-card border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[16px] sm:px-[20px] lg:px-[28px]">
        <div className="grid lg:grid-cols-[1fr_0.95fr] gap-[48px] lg:gap-[72px] items-center">
          <Reveal immediate animation="up" duration={800}>
            <p className="text-[13px] font-semibold text-[hsl(var(--brand-red))] mb-[16px]">
              {BRAND.name} {BRAND.tagline} · {t("brand.portalTitle")}
            </p>
            <h1 className="text-[2rem] sm:text-[2.75rem] lg:text-[3rem] font-bold tracking-[-0.02em] leading-[1.15] text-[hsl(var(--brand-navy))]">
              {t("landing.hero.headline")}{" "}
              <span className="text-[hsl(var(--brand-red))]">{t("landing.hero.headlineHighlight")}</span>
            </h1>
            <p className="mt-[20px] text-[17px] text-[hsl(var(--muted-foreground))] leading-[1.65] max-w-[540px]">
              {t("landing.hero.description")}
            </p>

            <ul className="mt-[28px] space-y-[10px]">
              {highlights.map((item, index) => (
                <Reveal key={item} immediate animation="left" delay={120 + index * 80} duration={650}>
                  <li className="flex items-start gap-[10px] text-[15px] text-[hsl(var(--brand-navy))]">
                    <PlatformIcons.check className="h-[18px] w-[18px] text-[hsl(var(--brand-red))] shrink-0 mt-[3px]" />
                    {item}
                  </li>
                </Reveal>
              ))}
            </ul>

            <Reveal immediate animation="up" delay={400} duration={700}>
              <div className="mt-[36px] flex flex-col sm:flex-row gap-[12px]">
                <Button
                  size="lg"
                  asChild
                  className="h-11 px-[24px] bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red)/0.92)] transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0"
                >
                  <Link href="/login" className="group">
                    {t("landing.actions.accessPortal")}
                    <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-11 px-[24px] transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0">
                  <a href="#institucional">{t("landing.actions.knowCompany")}</a>
                </Button>
              </div>

              <p className="mt-[16px] text-[13px] text-[hsl(var(--muted-foreground))]">
                {t("common.demoAccountsHint")}
              </p>
            </Reveal>
          </Reveal>

          <Reveal immediate animation="right" delay={180} duration={900}>
            <div className="landing-surface landing-surface-hover landing-image-wrap rounded-xl border border-border bg-card overflow-hidden shadow-soft">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={BRAND.heroImage}
                  alt={t("brand.heroImageAlt")}
                  fill
                  className="object-cover landing-image-zoom"
                  sizes="(max-width: 1024px) 100vw, 520px"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-[hsl(var(--brand-navy)/0.88)] px-[24px] py-[20px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--brand-yellow))] mb-[6px]">
                    {t("common.visionLabel")}
                  </p>
                  <p className="text-[14px] leading-[1.6] text-[white]/95 line-clamp-3">{visionContent}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-[12px] px-[20px] py-[14px] border-t border-border">
                <BrandLogo size="sm" />
                <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">
                  {t("brand.portalSubtitle")}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
