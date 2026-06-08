import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";

export const BRAND = {
  name: "Armazém Coral",
  tagline: "Achaqui",
  website: "https://www.armazemcoral.com.br",
  institutionalUrl: "https://www.armazemcoral.com.br/institucional",
  phone: "(81) 3972-7751",
  whatsapp: "(81) 99187-9002",
  email: "ecommerce@armazemcoral.com.br",
  heroImage: "/brand/hero-vision.jpg",
} as const;

export const LANDING_NAV_HREFS = [
  { href: "#institucional", key: "institutional" },
  { href: "#features", key: "portal" },
  { href: "#modules", key: "modules" },
  { href: "#how-it-works", key: "howItWorks" },
] as const;

export const LANDING_STAT_VALUES = [
  { value: "50+", key: "history" },
  { value: "24", key: "stores" },
  { value: "1.500+", key: "employees" },
  { value: "20 mil", key: "customers" },
] as const;

export const INSTITUTIONAL_PILLARS = [
  { id: "quem-somos", i18nKey: "quemSomos" },
  { id: "missao", i18nKey: "missao" },
  { id: "visao", i18nKey: "visao" },
  { id: "valores", i18nKey: "valores" },
] as const;

export const LANDING_FEATURE_KEYS: { icon: IconType; key: string }[] = [
  { icon: PlatformIcons.onboarding, key: "digitalOnboarding" },
  { icon: PlatformIcons.documents, key: "secureDocuments" },
  { icon: PlatformIcons.requests, key: "hrCommunication" },
  { icon: PlatformIcons.point, key: "timeMirror" },
  { icon: PlatformIcons.users, key: "usersRoles" },
  { icon: PlatformIcons.audit, key: "auditCompliance" },
];

export const LANDING_MODULE_KEYS: { icon: IconType; key: string }[] = [
  { icon: PlatformIcons.onboarding, key: "onboarding" },
  { icon: PlatformIcons.documents, key: "documents" },
  { icon: PlatformIcons.requests, key: "requests" },
  { icon: PlatformIcons.point, key: "point" },
  { icon: PlatformIcons.companies, key: "admin" },
  { icon: PlatformIcons.shield, key: "security" },
];

export const LANDING_STEP_KEYS = ["step1", "step2", "step3"] as const;

export const LANDING_STEP_NUMBERS = ["01", "02", "03"] as const;
