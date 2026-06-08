import { pt } from "./locales/pt";
import { en } from "./locales/en";
import type { Messages } from "./locales/pt";

export type { Messages } from "./locales/pt";

export type Locale = "pt" | "en";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
];

export const DEFAULT_LOCALE: Locale = "pt";

const MESSAGES: Record<Locale, Messages> = { pt, en: en as Messages };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, getMessages(locale) as unknown);

  if (typeof value !== "string") return key;

  if (!params) return value;

  return Object.entries(params).reduce(
    (text, [param, replacement]) => text.replaceAll(`{${param}}`, String(replacement)),
    value
  );
}

export function getHtmlLang(locale: Locale): string {
  return locale === "pt" ? "pt-BR" : "en";
}

export function getDateLocale(locale: Locale): string {
  return locale === "pt" ? "pt-BR" : "en-US";
}
