"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/features/i18n/store";
import {
  getDateLocale,
  getHtmlLang,
  getMessages,
  translate,
  type Locale,
} from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/locales/pt";

export function useTranslations() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  const messages: Messages = getMessages(locale);

  return {
    locale,
    setLocale,
    t,
    messages,
    htmlLang: getHtmlLang(locale),
    dateLocale: getDateLocale(locale),
  };
}

export type { Locale };
