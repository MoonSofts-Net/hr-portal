"use client";

import { LANDING_STAT_VALUES } from "@/lib/landing/content";
import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

export function StatsSection() {
  const { t } = useTranslations();

  return (
    <section className="bg-background border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[16px] sm:px-[20px] lg:px-[28px] py-[48px] sm:py-[56px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {LANDING_STAT_VALUES.map((stat, index) => (
            <Reveal key={stat.key} animation="up" delay={index * 100} duration={700}>
              <div className="px-[8px] sm:px-[16px] py-[16px] sm:py-[20px] lg:py-0 lg:first:pl-0 lg:last:pr-0 text-center lg:text-left landing-surface rounded-lg landing-surface-hover">
                <p className="text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] font-bold tracking-[-0.02em] text-[hsl(var(--brand-navy))] tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className="mt-[8px] text-[14px] text-[hsl(var(--muted-foreground))]">
                  {t(`landing.stats.${stat.key}`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
