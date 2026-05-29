export function TrustBar() {
  return (
    <section className="border-y border-border/80 bg-card/50">
      <div className="mx-auto max-w-[1200px] px-[20px] lg:px-[28px] py-[28px]">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-[20px]">
          Built for enterprise HR teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-[12px] lg:gap-[20px]">
          {["Onboarding", "Documents", "eSocial-ready*", "Multi-company", "Audit LGPD"].map(
            (label) => (
              <span
                key={label}
                className="rounded-full border border-border/80 bg-background px-[16px] py-[8px] text-sm font-medium text-muted-foreground"
              >
                {label}
              </span>
            )
          )}
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-[12px]">
          * Integration placeholders — not connected in V1
        </p>
      </div>
    </section>
  );
}
