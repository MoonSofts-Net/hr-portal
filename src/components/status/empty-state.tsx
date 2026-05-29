import type { IconType } from "react-icons";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconType;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = PlatformIcons.inbox,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card variant="outline" className="border-dashed">
      <div className="flex flex-col items-center justify-center py-[56px] px-[24px] text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-[20px]">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-[8px] max-w-sm leading-relaxed">
            {description}
          </p>
        )}
        {actionLabel && actionHref && (
          <Button asChild className="mt-[20px]">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
