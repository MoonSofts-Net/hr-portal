"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PlatformIcons } from "@/components/icons";
import { useAuthStore } from "@/features/auth/store";
import { getCurrentSession } from "@/lib/api/auth";
import { useMockApi } from "@/lib/api/config";
import { MOCK_TENANTS } from "@/mocks/seed";

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
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

  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  if (!isHydrated && !publicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center portal-shell-bg gap-[20px]">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <PlatformIcons.shield className="h-8 w-8 text-primary-foreground animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping opacity-20" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Portal RH</p>
          <p className="text-sm text-muted-foreground mt-[4px]">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return content;
}
