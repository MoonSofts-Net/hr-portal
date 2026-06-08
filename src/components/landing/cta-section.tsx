"use client";

import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { BRAND } from "@/lib/landing/content";
import { useTranslations } from "@/hooks/use-translations";

export function CtaSection() {
  const { t } = useTranslations();

  return (
    <section className="py-[72px] lg:py-[88px] bg-background">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <Reveal animation="scale" duration={800}>
          <div className="rounded-xl bg-[hsl(var(--brand-navy))] px-[32px] py-[40px] sm:px-[48px] sm:py-[48px] landing-surface landing-surface-hover">
            <div className="max-w-[560px]">
              <p className="text-[13px] font-semibold text-[hsl(var(--brand-yellow))] mb-[12px]">
                {BRAND.name} {BRAND.tagline}
              </p>
              <h2 className="text-[1.75rem] sm:text-[2rem] font-bold text-[white] tracking-[-0.02em] leading-[1.2]">
                {t("landing.cta.title")}
              </h2>
              <p className="mt-[14px] text-[16px] text-[white]/85 leading-[1.65]">
                {t("landing.cta.description")}
              </p>
              <div className="mt-[28px] flex flex-col sm:flex-row gap-[12px]">
                <Button
                  size="lg"
                  asChild
                  className="h-11 bg-[white] text-[hsl(var(--brand-navy))] hover:bg-[white]/92 font-semibold transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
                >
                  <Link href="/login">
                    {t("landing.actions.accessPortal")}
                    <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-11 bg-[white] text-[black] border-[white] hover:bg-[white]/92 hover:text-[black] font-semibold transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]"
                >
                  <Link href="/forgot-password">{t("landing.actions.forgotPassword")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
