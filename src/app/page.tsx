import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "Portal RH — Corporate HR Self-Service Platform",
  description:
    "Modern HR portal for onboarding, documents, requests, point mirror, roles, and LGPD-ready audit logs. Multi-tenant enterprise SaaS.",
  openGraph: {
    title: "Portal RH",
    description: "Corporate HR self-service portal built for enterprise teams",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
