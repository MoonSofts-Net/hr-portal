"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { hasAnyPermission, hasPermission } from "@/lib/permissions/check";
import { ROUTE_PERMISSIONS } from "@/lib/navigation";
import { LoadingState } from "@/components/status/loading-state";
import { useTranslations } from "@/hooks/use-translations";

function matchRoutePermission(pathname: string): string | string[] | undefined {
  const sorted = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return ROUTE_PERMISSIONS[route];
    }
  }
  return undefined;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, isHydrated, mustChangePassword } = useAuthStore();
  const { t } = useTranslations();

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    if (!session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }

    const required = matchRoutePermission(pathname);
    if (!required) return;

    const permissionIds = session.permissionIds;
    const allowed = Array.isArray(required)
      ? hasAnyPermission(permissionIds, required)
      : hasPermission(permissionIds, required);

    if (!allowed) {
      router.replace("/dashboard?error=unauthorized");
    }
  }, [session, isLoading, isHydrated, mustChangePassword, pathname, router]);

  if (!isHydrated || isLoading) {
    return <LoadingState message={t("routeGuard.checkingSession")} />;
  }

  if (!session) {
    return <LoadingState message={t("routeGuard.redirectingToLogin")} />;
  }

  return <>{children}</>;
}
