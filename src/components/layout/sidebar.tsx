"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PlatformIcons } from "@/components/icons";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BRAND } from "@/lib/landing/content";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import { usePermissions, useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { SidebarNavGroup, SidebarNavLink } from "./sidebar-nav-group";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href === "/dashboard") return false;
  return pathname.startsWith(`${item.href}/`);
}

function hasActiveChild(pathname: string, item: NavItem): boolean {
  if (!item.children?.length) return false;
  return item.children.some(
    (child) =>
      pathname === child.href ||
      (child.href !== item.href && pathname.startsWith(`${child.href}/`))
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { user, tenantName } = useAuthStore();
  const { t } = useTranslations();
  const items = getVisibleNavItems(permissions);

  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

  const isExpanded = useCallback(
    (item: NavItem) => {
      if (!item.children?.length) return false;
      if (expandedOverrides[item.href] !== undefined) {
        return expandedOverrides[item.href];
      }
      return isItemActive(pathname, item) || hasActiveChild(pathname, item);
    },
    [expandedOverrides, pathname]
  );

  const toggleExpanded = (href: string) => {
    setExpandedOverrides((prev) => {
      const item = items.find((i) => i.href === href);
      const current =
        prev[href] ??
        (item
          ? isItemActive(pathname, item) || hasActiveChild(pathname, item)
          : false);
      return { ...prev, [href]: !current };
    });
  };

  useEffect(() => {
    setExpandedOverrides((prev) => {
      let changed = false;
      const next = { ...prev };
      items.forEach((item) => {
        if (!item.children?.length) return;
        const shouldOpen = isItemActive(pathname, item) || hasActiveChild(pathname, item);
        if (shouldOpen && prev[item.href] === false) {
          delete next[item.href];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pathname, items]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex w-[272px] flex-col",
          "h-[100dvh] max-h-[100dvh] min-h-[100dvh]",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-transform duration-300 ease-out",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:shrink-0 lg:z-auto",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center gap-[12px] border-b border-sidebar-border px-[16px]">
          <BrandLogo href="/dashboard" size="sm" theme="dark" onClick={onClose} className="min-w-0 flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border/50"
            onClick={onClose}
          >
            <PlatformIcons.close className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-[12px] space-y-[4px] scrollbar-thin">
          <p className="px-[12px] py-[8px] text-[10px] font-bold uppercase tracking-widest text-sidebar-muted shrink-0">
            {t("nav.menu")}
          </p>
          {items.map((item) => {
            const active = isItemActive(pathname, item);

            if (item.children?.length) {
              return (
                <SidebarNavGroup
                  key={item.href}
                  item={item}
                  isActive={active}
                  isExpanded={isExpanded(item)}
                  onToggle={() => toggleExpanded(item.href)}
                  onNavigate={onClose}
                />
              );
            }

            return (
              <SidebarNavLink
                key={item.href}
                item={item}
                isActive={active}
                onNavigate={onClose}
              />
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-[16px] space-y-[12px]">
          <LanguageSwitcher className="w-full justify-center" />
          <p className="truncate text-[10px] text-sidebar-muted px-[4px]">{tenantName ?? BRAND.name}</p>
          <div className="rounded-xl bg-sidebar-border/30 p-[12px] flex items-center gap-[10px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-yellow)/0.25)] text-[hsl(var(--brand-yellow))]">
              <PlatformIcons.user className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-sidebar-muted truncate">{user?.roleName}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
