import Link from "next/link";
import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatVariant = "default" | "warning" | "success" | "danger";

const VARIANT_STYLES: Record<
  StatVariant,
  { icon: string; accent: string; ring: string }
> = {
  default: {
    icon: "bg-primary/10 text-primary",
    accent: "from-primary/5 to-transparent",
    ring: "group-hover:ring-primary/20",
  },
  warning: {
    icon: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
    accent: "from-amber-500/5 to-transparent",
    ring: "group-hover:ring-amber-500/20",
  },
  success: {
    icon: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
    accent: "from-emerald-500/5 to-transparent",
    ring: "group-hover:ring-emerald-500/20",
  },
  danger: {
    icon: "bg-red-100 text-red-600",
    accent: "from-red-500/5 to-transparent",
    ring: "group-hover:ring-red-500/20",
  },
};

interface StatCardProps {
  label: string;
  value: number | string;
  href?: string;
  variant?: StatVariant;
  icon?: IconType;
  description?: string;
}

export function StatCard({
  label,
  value,
  href,
  variant = "default",
  icon: Icon,
  description,
}: StatCardProps) {
  const styles = VARIANT_STYLES[variant];

  const content = (
    <Card
      variant="elevated"
      className={cn(
        "group stat-card-shine relative overflow-hidden p-[20px]",
        "hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300",
        href && "cursor-pointer ring-1 ring-transparent",
        href && styles.ring
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80 pointer-events-none",
          styles.accent
        )}
      />
      <div className="relative flex items-start justify-between gap-[12px]">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-[8px] text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {description && (
            <p className="mt-[6px] text-xs text-muted-foreground line-clamp-1">{description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-[8px]">
          {Icon && (
            <div className={cn("rounded-xl p-[10px]", styles.icon)}>
              <Icon className="h-[22px] w-[22px]" />
            </div>
          )}
          {href && (
            <PlatformIcons.arrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200" />
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block animate-fade-in">
        {content}
      </Link>
    );
  }

  return <div className="animate-fade-in">{content}</div>;
}
