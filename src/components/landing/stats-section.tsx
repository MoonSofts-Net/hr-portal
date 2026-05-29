import { LANDING_STATS } from "@/lib/landing/content";

export function StatsSection() {
  return (
    <section className="py-[64px] border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[24px] lg:gap-[32px]">
          {LANDING_STATS.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="text-4xl lg:text-5xl font-bold tracking-tight text-gradient-primary tabular-nums">
                {stat.value}
              </p>
              <p className="mt-[8px] text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
