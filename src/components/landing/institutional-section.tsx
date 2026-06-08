"use client";

import { useState } from "react";
import { INSTITUTIONAL_PILLARS } from "@/lib/landing/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

type PillarId = (typeof INSTITUTIONAL_PILLARS)[number]["id"];

export function InstitutionalSection() {
  const { t } = useTranslations();
  const [active, setActive] = useState<PillarId>(INSTITUTIONAL_PILLARS[0].id);
  const current = INSTITUTIONAL_PILLARS.find((p) => p.id === active) ?? INSTITUTIONAL_PILLARS[0];

  return (
    <section
      id="institucional"
      className="py-[56px] sm:py-[72px] lg:py-[88px] scroll-mt-nav bg-[hsl(var(--brand-navy))] text-[white]"
    >
      <div className="mx-auto max-w-[1200px] px-[16px] sm:px-[20px] lg:px-[28px]">
        <Reveal animation="up" duration={750}>
          <div className="max-w-[640px] mb-[40px]">
            <p className="text-[13px] font-semibold text-[hsl(var(--brand-yellow))] mb-[12px]">
              {t("landing.institutional.eyebrow")}
            </p>
            <h2 className="text-[2rem] sm:text-[2.25rem] font-bold tracking-[-0.02em] leading-[1.2]">
              {t("landing.institutional.title")}
            </h2>
            <p className="mt-[14px] text-[16px] text-[white]/85 leading-[1.65]">
              {t("landing.institutional.description")}
            </p>
          </div>
        </Reveal>

        <Reveal animation="fade" delay={120} duration={600}>
          <div className="-mx-[16px] flex gap-[4px] overflow-x-auto border-b border-[white]/15 px-[16px] pb-px scrollbar-thin sm:mx-0 sm:px-0 mb-[28px] sm:mb-[32px]">
            {INSTITUTIONAL_PILLARS.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActive(pillar.id)}
                className={cn(
                  "landing-tab-btn shrink-0 px-[14px] sm:px-[16px] py-[11px] sm:py-[12px] text-[13px] sm:text-[14px] font-medium border-b-2 -mb-px whitespace-nowrap",
                  active === pillar.id
                    ? "border-[hsl(var(--brand-yellow))] text-[white]"
                    : "border-transparent text-[white]/65 hover:text-[white] hover:border-[white]/25"
                )}
              >
                {t(`landing.institutional.pillars.${pillar.i18nKey}.title`)}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="max-w-[720px]">
          <div key={current.id} className="motion-safe:animate-landing-tab-in">
            <h3 className="text-[1.125rem] font-semibold text-[white]">
              {t(`landing.institutional.pillars.${current.i18nKey}.title`)}
            </h3>
            <p className="mt-[12px] text-[16px] text-[white]/85 leading-[1.7]">
              {t(`landing.institutional.pillars.${current.i18nKey}.content`)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
