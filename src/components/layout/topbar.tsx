"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PlatformIcons } from "@/components/icons";
import { useAuthStore, useRequestContext } from "@/features/auth/store";
import { logout } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  roles: "Roles",
  onboarding: "Onboarding",
  documents: "Documents",
  requests: "HR Requests",
  point: "Point",
  admin: "Administration",
  "audit-logs": "Audit Logs",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user, tenantName, clearAuth } = useAuthStore();
  const context = useRequestContext();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const breadcrumbs = useBreadcrumbs();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", context.userId],
    queryFn: () => getNotifications(context),
    enabled: !!context.userId,
  });

  const unread = notifications.filter((n) => !n.read).length;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    clearAuth();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-[12px] px-[16px] lg:px-[24px]">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
        >
          <PlatformIcons.menu className="h-5 w-5" />
        </Button>

        <nav className="hidden md:flex items-center gap-[6px] text-sm min-w-0">
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-[6px] min-w-0">
              {crumb.href !== breadcrumbs[0]?.href && (
                <PlatformIcons.chevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {crumb.isLast ? (
                <span className="font-semibold text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex-1 max-w-md hidden lg:block mx-[8px]">
          <div className="relative">
            <PlatformIcons.search className="absolute left-[12px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules, users, documents..."
              className="pl-[40px] h-10 bg-muted/40 border-transparent focus:bg-card"
              disabled
            />
          </div>
        </div>

        <div className="flex items-center gap-[8px] ml-auto shrink-0">
          <div className="hidden sm:flex items-center gap-[8px] rounded-full border border-border/80 bg-muted/30 px-[12px] py-[6px] text-xs font-medium text-muted-foreground">
            <PlatformIcons.building className="h-[16px] w-[16px]" />
            <span className="max-w-[120px] truncate">{tenantName}</span>
          </div>

          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notifications"
            >
              <PlatformIcons.bell className="h-[20px] w-[20px]" />
              {unread > 0 && (
                <span className="absolute top-[6px] right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-[4px] text-[10px] font-bold text-[white]">
                  {unread}
                </span>
              )}
            </Button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-[10px] w-[360px] rounded-xl border border-border/80 bg-card shadow-elevated z-50 overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between border-b border-border/80 px-[16px] py-[14px]">
                  <p className="font-semibold text-sm">Notifications</p>
                  {unread > 0 && (
                    <Badge variant="danger">{unread} new</Badge>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-[24px] text-sm text-muted-foreground text-center">
                      You are all caught up
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link ?? "#"}
                        className={cn(
                          "block px-[16px] py-[14px] border-b border-border/50 transition-colors hover:bg-muted/50",
                          !n.read && "bg-primary/[0.03]"
                        )}
                        onClick={() => setShowNotifs(false)}
                      >
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-muted-foreground text-xs mt-[4px] line-clamp-2">
                          {n.body}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-[10px] rounded-xl border border-border/80 bg-card pl-[12px] pr-[4px] py-[4px] shadow-soft">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground">{user?.roleName}</p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-primary/15">
              <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            className="text-muted-foreground hover:text-destructive"
          >
            <PlatformIcons.logout className="h-[20px] w-[20px]" />
          </Button>

          <Badge variant="outline" className="hidden xl:flex gap-[6px] font-normal normal-case tracking-normal">
            <PlatformIcons.shield className="h-3.5 w-3.5" />
            MFA
          </Badge>
        </div>
      </div>
    </header>
  );
}
