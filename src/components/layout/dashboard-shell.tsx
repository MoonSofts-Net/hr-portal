"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { RouteGuard } from "@/components/guards/route-guard";
import { PageContainer } from "./page-container";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RouteGuard>
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-[100dvh] overflow-hidden bg-background">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-h-0 min-w-0 portal-shell-bg">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 min-h-0 overflow-auto p-[16px] lg:p-[28px]">
            <PageContainer>{children}</PageContainer>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
