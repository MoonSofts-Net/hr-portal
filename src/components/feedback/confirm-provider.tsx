"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PlatformIcons } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";

export type ConfirmVariant = "default" | "destructive" | "success" | "warning";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  details?: string;
  loadingLabel?: string;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  loading: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { accent: string; iconBg: string; icon: typeof PlatformIcons.check; button: "default" | "destructive" }
> = {
  default: {
    accent: "from-primary/20 via-primary/5 to-transparent",
    iconBg: "bg-primary/10 text-primary ring-primary/20",
    icon: PlatformIcons.shield,
    button: "default",
  },
  destructive: {
    accent: "from-destructive/20 via-destructive/5 to-transparent",
    iconBg: "bg-destructive/10 text-destructive ring-destructive/20",
    icon: PlatformIcons.alert,
    button: "destructive",
  },
  success: {
    accent: "from-[hsl(var(--success)_/_0.2)] via-[hsl(var(--success)_/_0.05)] to-transparent",
    iconBg: "bg-[hsl(var(--success-bg))] text-[hsl(var(--success))] ring-[hsl(var(--success)_/_0.2)]",
    icon: PlatformIcons.check,
    button: "default",
  },
  warning: {
    accent: "from-[hsl(var(--warning)_/_0.2)] via-[hsl(var(--warning)_/_0.05)] to-transparent",
    iconBg: "bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))] ring-[hsl(var(--warning)_/_0.2)]",
    icon: PlatformIcons.alert,
    button: "default",
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslations();
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const [state, setState] = useState<ConfirmState>({
    open: false,
    loading: false,
    title: "",
    variant: "default",
    confirmLabel: t("common.confirm"),
    cancelLabel: t("common.cancel"),
  });

  const close = useCallback((result: boolean) => {
    setState((prev) => ({ ...prev, open: false, loading: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        loading: false,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? t("common.confirm"),
        cancelLabel: options.cancelLabel ?? t("common.cancel"),
        variant: options.variant ?? "default",
        details: options.details,
        loadingLabel: options.loadingLabel,
      });
    });
  }, [t]);

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const styles = VARIANT_STYLES[state.variant ?? "default"];
  const Icon = styles.icon;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open && !state.loading) close(false);
        }}
      >
        <DialogContent className="max-w-[440px] p-0 overflow-hidden gap-0">
          <div className={cn("h-[4px] w-full bg-gradient-to-r", styles.accent)} />
          <div className="p-[24px] pt-[20px]">
            <DialogHeader className="items-center sm:items-start text-center sm:text-left">
              <div
                className={cn(
                  "mb-[16px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl ring-4",
                  styles.iconBg
                )}
              >
                <Icon className="h-[24px] w-[24px]" />
              </div>
              <DialogTitle className="text-xl">{state.title}</DialogTitle>
              {state.description && (
                <DialogDescription className="text-[15px]">{state.description}</DialogDescription>
              )}
            </DialogHeader>

            {state.details && (
              <div className="mt-[16px] rounded-xl border border-border/80 bg-muted/40 px-[14px] py-[12px] text-sm text-muted-foreground whitespace-pre-wrap">
                {state.details}
              </div>
            )}

            <DialogFooter className="mt-[24px] sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={state.loading}
                onClick={() => close(false)}
                className="min-w-[100px]"
              >
                {state.cancelLabel}
              </Button>
              <Button
                type="button"
                variant={styles.button}
                disabled={state.loading}
                className="min-w-[100px] shadow-soft"
                onClick={() => close(true)}
              >
                {state.confirmLabel}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

/** Runs an async action after user confirms; returns false if cancelled. */
export async function runWithConfirm(
  confirm: (options: ConfirmOptions) => Promise<boolean>,
  options: ConfirmOptions,
  action: () => Promise<void>
): Promise<boolean> {
  const approved = await confirm(options);
  if (!approved) return false;
  await action();
  return true;
}
