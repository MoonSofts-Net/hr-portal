"use client";

import { Reveal } from "@/components/landing/reveal";
import { useTranslations } from "@/hooks/use-translations";

export function TrustBar() {
  const { t, messages } = useTranslations();
  const items = messages.landing.trust.items;

  return (
    <section className="bg-background border-b border-border">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <Reveal animation="fade" duration={600}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[16px] py-[20px]">
            <p className="text-[13px] font-medium text-[hsl(var(--brand-navy))] shrink-0">
              {t("landing.trust.title")}
            </p>
            <ul className="flex flex-wrap gap-x-[20px] gap-y-[8px]">
              {items.map((label, index) => (
                <Reveal key={label} animation="up" delay={index * 60} duration={550}>
                  <li className="text-[13px] text-[hsl(var(--muted-foreground))] before:content-[''] before:inline-block before:w-[5px] before:h-[5px] before:rounded-full before:bg-[hsl(var(--brand-red))] before:mr-[8px] before:align-middle">
                    {label}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
