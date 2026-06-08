"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { PlatformIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { bar: string; iconBg: string; icon: typeof PlatformIcons.check }
> = {
  success: {
    bar: "bg-[hsl(var(--success))]",
    iconBg: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))]",
    icon: PlatformIcons.check,
  },
  error: {
    bar: "bg-destructive",
    iconBg: "bg-destructive/10 text-destructive",
    icon: PlatformIcons.alert,
  },
  info: {
    bar: "bg-primary",
    iconBg: "bg-[hsl(var(--info-bg))] text-[hsl(var(--info))]",
    icon: PlatformIcons.shield,
  },
  warning: {
    bar: "bg-[hsl(var(--warning))]",
    iconBg: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))]",
    icon: PlatformIcons.alert,
  },
};

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { ...input, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    toast: push,
    success: (title, description) => push({ title, description, variant: "success" }),
    error: (title, description) => push({ title, description, variant: "error" }),
    info: (title, description) => push({ title, description, variant: "info" }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-[24px] right-[24px] z-[100] flex w-full max-w-[380px] flex-col gap-[10px]"
      >
        {toasts.map((item) => {
          const styles = VARIANT_STYLES[item.variant];
          const Icon = styles.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-elevated",
                "animate-toast-in"
              )}
            >
              <div className={cn("absolute left-0 top-0 h-full w-[4px]", styles.bar)} />
              <div className="flex items-start gap-[12px] p-[14px] pl-[18px]">
                <div
                  className={cn(
                    "mt-[2px] flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg",
                    styles.iconBg
                  )}
                >
                  <Icon className="h-[16px] w-[16px]" />
                </div>
                <div className="min-w-0 flex-1 pr-[24px]">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="mt-[2px] text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="absolute right-[10px] top-[10px] rounded-md p-[4px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <PlatformIcons.close className="h-[14px] w-[14px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
