"use client";

import { LANDING_FEATURE_KEYS } from "@/lib/landing/content";
import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

export function FeaturesSection() {
  const { t } = useTranslations();

  return (
    <section id="features" className="py-[56px] sm:py-[72px] lg:py-[88px] scroll-mt-nav bg-card border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <Reveal animation="up" duration={700}>
          <div className="max-w-[560px] mb-[48px]">
            <p className="text-[13px] font-semibold text-[hsl(var(--brand-red))] mb-[12px]">
              {t("landing.features.eyebrow")}
            </p>
            <h2 className="text-[2rem] sm:text-[2.25rem] font-bold tracking-[-0.02em] text-[hsl(var(--brand-navy))] leading-[1.2]">
              {t("landing.features.title")}
            </h2>
            <p className="mt-[14px] text-[16px] text-[hsl(var(--muted-foreground))] leading-[1.65]">
              {t("landing.features.description")}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-border rounded-xl overflow-hidden border border-border">
          {LANDING_FEATURE_KEYS.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.key} animation="up" delay={index * 70} duration={650}>
                <article className="group bg-card p-[28px] landing-row-hover h-full cursor-default">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-[hsl(var(--brand-navy))] mb-[16px] transition-colors duration-300 group-hover:bg-[hsl(var(--brand-red)/0.1)]">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[hsl(var(--brand-navy))]">
                    {t(`landing.features.items.${feature.key}.title`)}
                  </h3>
                  <p className="mt-[8px] text-[14px] text-[hsl(var(--muted-foreground))] leading-[1.6]">
                    {t(`landing.features.items.${feature.key}.description`)}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
