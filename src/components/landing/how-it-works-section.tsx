"use client";

import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { LANDING_STEP_KEYS, LANDING_STEP_NUMBERS } from "@/lib/landing/content";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

export function HowItWorksSection() {
  const { t } = useTranslations();

  return (
    <section id="how-it-works" className="py-[56px] sm:py-[72px] lg:py-[88px] scroll-mt-nav bg-card border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <Reveal animation="up" duration={700}>
          <div className="max-w-[560px] mb-[40px]">
            <p className="text-[13px] font-semibold text-[hsl(var(--brand-red))] mb-[12px]">
              {t("landing.steps.eyebrow")}
            </p>
            <h2 className="text-[2rem] sm:text-[2.25rem] font-bold tracking-[-0.02em] text-[hsl(var(--brand-navy))] leading-[1.2]">
              {t("landing.steps.title")}
            </h2>
          </div>
        </Reveal>

        <ol className="space-y-0 rounded-xl border border-border overflow-hidden landing-surface">
          {LANDING_STEP_KEYS.map((stepKey, index) => (
            <Reveal key={stepKey} animation="up" delay={index * 90} duration={650}>
              <li
                className={`group flex gap-[20px] p-[24px] sm:p-[28px] bg-card landing-row-hover ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-navy))] text-[13px] font-bold text-[white] transition-transform duration-300 group-hover:scale-105">
                  {LANDING_STEP_NUMBERS[index]}
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-[hsl(var(--brand-navy))]">
                    {t(`landing.steps.items.${stepKey}.title`)}
                  </h3>
                  <p className="mt-[6px] text-[14px] text-[hsl(var(--muted-foreground))] leading-[1.6]">
                    {t(`landing.steps.items.${stepKey}.description`)}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal animation="up" delay={300} duration={600}>
          <div className="mt-[32px]">
            <Button
              asChild
              className="bg-[hsl(var(--brand-red))] hover:bg-[hsl(var(--brand-red)/0.92)] transition-all duration-300 hover:-translate-y-[1px] active:translate-y-0"
            >
              <Link href="/login">
                {t("landing.actions.accessDemo")}
                <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
