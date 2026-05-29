import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { LANDING_STEPS } from "@/lib/landing/content";
import { Button } from "@/components/ui/button";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-[80px] lg:py-[100px] scroll-mt-[88px]">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="text-center max-w-2xl mx-auto mb-[56px]">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-[12px]">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            From setup to daily operations
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px] relative">
          <div className="hidden lg:block absolute top-[48px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {LANDING_STEPS.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-border/80 bg-card p-[32px] shadow-soft text-center lg:text-left"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-glow">
                {item.step}
              </span>
              <h3 className="mt-[20px] text-xl font-bold">{item.title}</h3>
              <p className="mt-[10px] text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-[48px] text-center">
          <Button size="lg" asChild>
            <Link href="/login">
              Start with demo access
              <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
