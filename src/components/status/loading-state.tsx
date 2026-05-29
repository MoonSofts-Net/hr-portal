import { PlatformIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Loading...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-[56px] gap-[16px] rounded-xl border border-dashed border-border/80 bg-muted/20",
        className
      )}
    >
      <div className="relative">
        <PlatformIcons.loader className="h-9 w-9 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
