"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlatformIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";
import type { NavItem } from "@/lib/navigation";

interface SidebarNavGroupProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export function SidebarNavGroup({
  item,
  isActive,
  isExpanded,
  onToggle,
  onNavigate,
}: SidebarNavGroupProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const label = t(item.labelKey);
  const Icon = item.icon;

  return (
    <div className="space-y-[2px]">
      <div
        className={cn(
          "group flex items-center gap-[4px] rounded-lg pr-[8px] transition-all duration-200",
          isActive && "sidebar-nav-active"
        )}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-[12px] rounded-lg px-[12px] py-[11px] text-[13px] font-medium min-w-0 transition-colors duration-200",
            isActive
              ? "text-[white]"
              : "text-sidebar-muted hover:text-sidebar-foreground"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
              isActive
                ? "bg-[hsl(var(--brand-yellow)/0.22)] text-[hsl(var(--brand-yellow))]"
                : "bg-sidebar-border/30 text-sidebar-muted group-hover:bg-sidebar-border/50 group-hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex-1 truncate">{label}</span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label}`}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
            "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border/50",
            isActive && "text-[white]/80 hover:text-[white]"
          )}
        >
          <PlatformIcons.chevronDown
            className={cn(
              "h-[18px] w-[18px] transition-transform duration-300 ease-out",
              isExpanded && "rotate-180"
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "ml-[20px] border-l border-sidebar-border pl-[14px] space-y-[2px] pb-[4px]",
              "transition-opacity duration-300 ease-out",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            {item.children?.map((child) => {
              const childActive =
                pathname === child.href ||
                (child.href !== item.href && pathname.startsWith(`${child.href}/`));
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-[8px] rounded-md px-[10px] py-[8px] text-xs font-medium transition-all duration-200",
                    childActive
                      ? "text-[hsl(var(--brand-yellow))] bg-[hsl(var(--brand-yellow)/0.12)]"
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border/30"
                  )}
                >
                  <ChildIcon className="h-[14px] w-[14px] shrink-0 opacity-80" />
                  {t(child.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SidebarNavLinkProps {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}

export function SidebarNavLink({ item, isActive, onNavigate }: SidebarNavLinkProps) {
  const Icon = item.icon;
  const { t } = useTranslations();
  const label = t(item.labelKey);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-[12px] rounded-lg px-[12px] py-[11px] text-[13px] font-medium transition-all duration-200",
        isActive
          ? "sidebar-nav-active text-[white]"
          : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-border/40"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
          isActive
            ? "bg-[hsl(var(--brand-yellow)/0.22)] text-[hsl(var(--brand-yellow))]"
            : "bg-sidebar-border/30 text-sidebar-muted group-hover:bg-sidebar-border/50 group-hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
