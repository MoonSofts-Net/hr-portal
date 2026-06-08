"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ModulesSection } from "@/components/landing/modules-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InstitutionalSection } from "@/components/landing/institutional-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

/** Public marketing landing — redirects authenticated users to dashboard */
export function LandingPage() {
  const router = useRouter();
  const { session, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && session) {
      router.replace("/dashboard");
    }
  }, [isHydrated, session, router]);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <StatsSection />
        <InstitutionalSection />
        <FeaturesSection />
        <ModulesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
