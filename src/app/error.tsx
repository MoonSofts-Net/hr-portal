"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center portal-shell-bg p-[24px]">
      <div className="w-full max-w-md text-center space-y-[20px]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <PlatformIcons.alert className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-[8px]">
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-[12px]">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
