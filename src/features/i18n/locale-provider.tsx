"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/features/i18n/store";
import { getHtmlLang } from "@/lib/i18n";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = getHtmlLang(locale);
  }, [locale]);

  return children;
}
