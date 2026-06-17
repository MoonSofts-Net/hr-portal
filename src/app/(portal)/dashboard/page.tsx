"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlatformIcons } from "@/components/icons";
import type { IconType } from "react-icons";
import { getDashboardStats } from "@/lib/api/dashboard";
import { getNotifications } from "@/lib/api/notifications";
import { useAuthStore, useRequestContext } from "@/features/auth/store";
import { useTranslations } from "@/hooks/use-translations";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/status/loading-state";
import { ErrorState } from "@/components/status/error-state";
import { StatusBadge } from "@/components/status/status-badge";
import { formatDate } from "@/lib/utils";
import type { DashboardCard } from "@/types";
import { getNotificationText } from "@/lib/notifications/format";

const CARD_ICONS: Record<string, IconType> = {
  c1: PlatformIcons.dashboard,
  c2: PlatformIcons.documents,
  c3: PlatformIcons.requests,
  c4: PlatformIcons.point,
};

function getCardIcon(card: DashboardCard, roleType: string): IconType {
  if (roleType === "super_admin" && card.id === "c1") return PlatformIcons.companies;
  if (roleType === "super_admin" && card.id === "c2") return PlatformIcons.users;
  return CARD_ICONS[card.id] ?? PlatformIcons.dashboard;
}

export default function DashboardPage() {
  const { session, user, tenantName } = useAuthStore();
  const context = useRequestContext();
  const { t } = useTranslations();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", context.tenantId, session?.roleId],
    queryFn: () => getDashboardStats(context, session!.roleId),
    enabled: !!session?.roleId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", context.userId],
    queryFn: () => getNotifications(context),
    enabled: !!context.userId,
  });

  const roleTitles: Record<string, string> = {
    employee: t("dashboard.employee"),
    hr: t("dashboard.hr"),
    manager: t("dashboard.manager"),
    super_admin: t("dashboard.superAdmin"),
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.goodMorning");
    if (hour < 18) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  };

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(" ")[0] ?? t("dashboard.greetingFallbackName")}`}
        description={
          data
            ? `${roleTitles[data.roleType] ?? t("nav.dashboard")} · ${tenantName}`
            : t("dashboard.overview")
        }
        badge={
          data && (
            <Badge variant="secondary" className="normal-case tracking-normal font-medium">
              {user?.roleName}
            </Badge>
          )
        }
      />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={t("dashboard.loadError")} onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[16px] mb-[28px]">
            {data.cards.map((card, index) => (
              <div
                key={card.id}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-fade-in opacity-0 [animation-fill-mode:forwards]"
              >
                <StatCard
                  label={card.label}
                  value={card.value}
                  href={card.href}
                  variant={card.variant ?? "default"}
                  icon={getCardIcon(card, data.roleType)}
                />
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <Card variant="elevated" className="mb-[28px]">
              <CardHeader className="border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <PlatformIcons.bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("dashboard.recentNotifications")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {notifications.slice(0, 5).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    className="flex items-start justify-between gap-[16px] px-[24px] py-[16px] border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{getNotificationText(n, t).title}</p>
                      <p className="text-xs text-muted-foreground mt-[2px] line-clamp-2">
                        {getNotificationText(n, t).body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(n.createdAt)}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {data.recentItems && data.recentItems.length > 0 && (
            <Card variant="elevated">
              <CardHeader className="border-b border-border/60 bg-muted/20 flex flex-row items-center gap-[10px]">
                <PlatformIcons.dashboard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{t("dashboard.recentActivity")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-[2px] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-[10px] shrink-0">
                      {item.status && <StatusBadge status={item.status} />}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
