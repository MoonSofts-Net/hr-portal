import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HIGHLIGHTS = [
  "Multi-tenant SaaS architecture",
  "LGPD-ready audit logs",
  "Role-based access control",
];

export function HeroSection() {
  return (
    <section className="relative pt-[120px] pb-[80px] lg:pt-[140px] lg:pb-[100px] overflow-hidden landing-mesh">
      <div className="absolute inset-0 landing-grid-bg pointer-events-none" />
      <div className="absolute inset-0 landing-hero-glow pointer-events-none" />

      <div className="relative mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="grid lg:grid-cols-2 gap-[48px] lg:gap-[64px] items-center">
          <div className="animate-fade-in">
            <Badge variant="secondary" className="mb-[20px] normal-case tracking-normal font-medium px-[12px] py-[6px]">
              V1 · Production-ready HR portal
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] text-foreground">
              The modern way to run{" "}
              <span className="text-gradient-primary">corporate HR</span> operations
            </h1>
            <p className="mt-[20px] text-lg text-muted-foreground leading-relaxed max-w-xl">
              Portal RH centralizes onboarding, documents, HR requests, point mirror,
              and compliance — built for employees, managers, HR, and platform administrators.
            </p>

            <ul className="mt-[28px] space-y-[12px]">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-[10px] text-sm font-medium">
                  <PlatformIcons.check className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-[36px] flex flex-col sm:flex-row gap-[12px]">
              <Button size="lg" asChild className="shadow-glow h-12 px-[28px]">
                <Link href="/login">
                  Get started
                  <PlatformIcons.arrowRight className="ml-[8px] h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12">
                <a href="#modules">
                  <PlatformIcons.playCircle className="mr-[8px] h-4 w-4" />
                  Explore modules
                </a>
              </Button>
            </div>

            <p className="mt-[20px] text-xs text-muted-foreground">
              Demo accounts available on the sign-in page · No backend required for V1 preview
            </p>
          </div>

          <div className="relative animate-fade-in lg:opacity-0 lg:[animation-fill-mode:forwards]" style={{ animationDelay: "150ms" }}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl" />
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="relative rounded-2xl border border-border/80 bg-card shadow-elevated overflow-hidden">
      <div className="flex items-center gap-[8px] border-b border-border/80 bg-muted/40 px-[16px] py-[12px]">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-[12px] text-[11px] text-muted-foreground font-medium">
          portal-rh.app/dashboard
        </span>
      </div>
      <div className="flex min-h-[320px]">
        <div className="w-[72px] border-r border-border/60 bg-sidebar p-[12px] hidden sm:block">
          <div className="h-8 w-8 rounded-lg bg-primary/30 mb-[16px]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-7 rounded-md mb-[8px] ${i === 1 ? "bg-primary/40" : "bg-sidebar-border/60"}`}
            />
          ))}
        </div>
        <div className="flex-1 p-[16px] bg-background/50">
          <div className="h-8 w-2/3 max-w-[200px] rounded-lg bg-muted mb-[16px]" />
          <div className="grid grid-cols-2 gap-[10px] mb-[16px]">
            {["Onboarding", "Documents", "Requests", "Point"].map((label, i) => (
              <div
                key={label}
                className="rounded-xl border border-border/60 bg-card p-[12px] shadow-soft"
              >
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xl font-bold mt-[6px] tabular-nums">
                  {[85, 12, 4, 2][i]}
                  {i === 0 ? "%" : ""}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-[12px]">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-[10px]">
              Recent activity
            </p>
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-[10px] py-[8px] border-b border-border/40 last:border-0">
                <div className="h-8 w-8 rounded-full bg-primary/15 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-2.5 w-3/4 rounded bg-muted mb-[6px]" />
                  <div className="h-2 w-1/2 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
