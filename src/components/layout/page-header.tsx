import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  badge,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-[28px] rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-[20px] sm:p-[24px] shadow-soft",
        className
      )}
    >
      <div className="flex flex-col gap-[16px] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-[6px]">
          <div className="flex flex-wrap items-center gap-[12px]">
            <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-[8px] shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
