"use client";

import { cn } from "@/lib/utils";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useTranslations } from "@/hooks/use-translations";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "compact" | "full";
}

export function LanguageSwitcher({ className, variant = "compact" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslations();

  return (
    <div
      className={cn("inline-flex items-center rounded-md border border-border bg-muted/40 p-[3px]", className)}
      role="group"
      aria-label={t("language.switchTo")}
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          className={cn(
            "rounded-[5px] px-[10px] py-[5px] text-[12px] font-semibold transition-all duration-200",
            locale === code
              ? "bg-card text-[hsl(var(--brand-navy))] shadow-soft"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--brand-navy))]"
          )}
          aria-pressed={locale === code}
          aria-label={t(`language.${code}`)}
        >
          {variant === "full" ? t(`language.${code}`) : label}
        </button>
      ))}
    </div>
  );
}
