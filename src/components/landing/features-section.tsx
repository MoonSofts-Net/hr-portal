import { LANDING_FEATURES } from "@/lib/landing/content";
import { Card, CardContent } from "@/components/ui/card";

export function FeaturesSection() {
  return (
    <section id="features" className="py-[80px] lg:py-[100px] scroll-mt-[88px]">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px]">
        <div className="text-center max-w-2xl mx-auto mb-[48px]">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-[12px]">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything HR needs in one portal
          </h2>
          <p className="mt-[16px] text-muted-foreground leading-relaxed">
            Modular by design — connect your backend when ready without refactoring the UI layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          {LANDING_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                variant="elevated"
                className="group hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-[28px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-[20px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{feature.title}</h3>
                  <p className="mt-[10px] text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
