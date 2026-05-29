import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-[48px] gap-[12px] rounded-xl border border-destructive/20 bg-destructive/5">
      <PlatformIcons.alert className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
