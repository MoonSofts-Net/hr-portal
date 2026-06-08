"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND } from "@/lib/landing/content";
import { ConfirmProvider } from "@/components/feedback/confirm-provider";
import { ToastProvider } from "@/components/feedback/toast-provider";
import { LocaleProvider } from "@/features/i18n/locale-provider";
import { useAuthStore } from "@/features/auth/store";
import { getCurrentSession } from "@/lib/api/auth";
import { useMockApi } from "@/lib/api/config";
import { MOCK_TENANTS } from "@/mocks/seed";
import { useTranslations } from "@/hooks/use-translations";

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

function LoadingScreen() {
  const { t } = useTranslations();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center portal-shell-bg gap-[20px]">
      <BrandLogo size="md" subtitle={t("brand.portalSubtitle")} />
      <div className="text-center">
        <p className="font-semibold text-[hsl(var(--brand-navy))]">{BRAND.name}</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-[4px]">{t("auth.loadingWorkspace")}</p>
      </div>
    </div>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoute = isPublicRoute(pathname);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  const { setAuth, clearAuth, setLoading, setHydrated, isHydrated } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getCurrentSession();
        if (!mounted) return;
        if (result) {
          const tenantName =
            result.tenantName ??
            (useMockApi()
              ? MOCK_TENANTS.find((t) => t.id === result.user.tenantId)?.name
              : "") ??
            "";
          setAuth(result.session, result.user, tenantName);
        } else {
          clearAuth();
        }
      } catch {
        if (mounted) clearAuth();
      } finally {
        if (mounted) {
          setLoading(false);
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setAuth, clearAuth, setLoading, setHydrated]);

  const content = (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConfirmProvider>
      </QueryClientProvider>
    </LocaleProvider>
  );

  if (!isHydrated && !publicRoute) {
    return <LoadingScreen />;
  }

  return content;
}
