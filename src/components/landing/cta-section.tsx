import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-[80px] lg:py-[100px]">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-[40px] sm:p-[56px] text-center shadow-glow">
          <div className="absolute inset-0 auth-grid-pattern opacity-30 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
              Ready to transform your HR operations?
            </h2>
            <p className="mt-[16px] text-primary-foreground/85 max-w-lg mx-auto leading-relaxed">
              Sign in with a demo role and explore the full portal — dashboard, onboarding,
              documents, requests, and more.
            </p>
            <div className="mt-[32px] flex flex-col sm:flex-row items-center justify-center gap-[12px]">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-12 px-[28px] bg-[white] text-primary hover:bg-[white]/90"
              >
                <Link href="/login">
                  Access Portal RH
                  <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 border-[white]/40 text-primary-foreground hover:bg-[white]/10 hover:text-primary-foreground"
              >
                <Link href="/forgot-password">Forgot password</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
