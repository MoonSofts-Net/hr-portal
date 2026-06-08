"use client";

import { LANDING_MODULE_KEYS } from "@/lib/landing/content";
import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

export function ModulesSection() {
  const { t } = useTranslations();

  return (
    <section id="modules" className="py-[56px] sm:py-[72px] lg:py-[88px] scroll-mt-nav bg-background border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <Reveal animation="up" duration={700}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[20px] mb-[40px]">
            <div className="max-w-[560px]">
              <p className="text-[13px] font-semibold text-[hsl(var(--brand-red))] mb-[12px]">
                {t("landing.modules.eyebrow")}
              </p>
              <h2 className="text-[2rem] sm:text-[2.25rem] font-bold tracking-[-0.02em] text-[hsl(var(--brand-navy))] leading-[1.2]">
                {t("landing.modules.title")}
              </h2>
              <p className="mt-[14px] text-[16px] text-[hsl(var(--muted-foreground))] leading-[1.65]">
                {t("landing.modules.description")}
              </p>
            </div>
            <p className="text-[13px] font-medium text-[hsl(var(--muted-foreground))] lg:pb-[4px]">
              {t("common.modulesImplemented")}
            </p>
          </div>
        </Reveal>

        <div className="rounded-xl border border-border overflow-hidden landing-surface">
          {LANDING_MODULE_KEYS.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <Reveal key={mod.key} animation="left" delay={index * 60} duration={600}>
                <div
                  className={`group flex gap-[16px] items-start p-[20px] sm:p-[24px] bg-card landing-row-hover ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-[hsl(var(--brand-navy))] transition-all duration-300 group-hover:bg-[hsl(var(--brand-navy))] group-hover:text-[white]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[8px] mb-[4px]">
                      <h3 className="text-[15px] font-semibold text-[hsl(var(--brand-navy))]">
                        {t(`landing.modules.items.${mod.key}.title`)}
                      </h3>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        {t(`landing.modules.items.${mod.key}.tag`)}
                      </span>
                    </div>
                    <p className="text-[14px] text-[hsl(var(--muted-foreground))] leading-[1.6]">
                      {t(`landing.modules.items.${mod.key}.description`)}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
