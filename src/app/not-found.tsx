import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center portal-shell-bg p-[24px]">
      <div className="w-full max-w-md text-center space-y-[20px]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <PlatformIcons.search className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-[8px]">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
          <h1 className="text-xl font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
