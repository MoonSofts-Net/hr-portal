import { LANDING_MODULES } from "@/lib/landing/content";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ModulesSection() {
  return (
    <section
      id="modules"
      className="py-[80px] lg:py-[100px] scroll-mt-[88px] bg-muted/30 border-y border-border/60"
    >
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-[24px] mb-[48px]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-[12px]">
              Modules
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              V1 product scope, enterprise depth
            </h2>
            <p className="mt-[16px] text-muted-foreground leading-relaxed">
              Each module maps to a domain in the codebase — ready for real API integration.
            </p>
          </div>
          <Badge variant="outline" className="w-fit normal-case tracking-normal font-medium text-sm px-[14px] py-[8px]">
            11 core areas implemented
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {LANDING_MODULES.map((mod, index) => {
            const Icon = mod.icon;
            const isWide = index === 0 || index === 5;
            return (
              <div
                key={mod.title}
                className={cn(
                  "group rounded-2xl border border-border/80 bg-card p-[24px] shadow-soft",
                  "hover:shadow-elevated hover:border-primary/25 transition-all duration-300",
                  isWide && "md:col-span-2 lg:col-span-1"
                )}
              >
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="normal-case tracking-normal text-[10px]">
                    {mod.tag}
                  </Badge>
                </div>
                <h3 className="mt-[16px] font-bold text-lg">{mod.title}</h3>
                <p className="mt-[8px] text-sm text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
