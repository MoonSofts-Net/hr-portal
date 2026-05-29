"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LANDING_NAV } from "@/lib/landing/content";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-card/90 backdrop-blur-xl shadow-soft py-[12px]"
          : "bg-transparent py-[20px]"
      )}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-[20px] lg:px-[28px]">
        <Link href="/" className="flex items-center gap-[12px] group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow transition-transform group-hover:scale-105">
            <PlatformIcons.shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-[15px] tracking-tight">Portal RH</span>
            <span className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest">
              Enterprise HR
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-[32px]">
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-[10px]">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="shadow-glow">
            <Link href="/login">Access portal</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <PlatformIcons.close className="h-5 w-5" /> : <PlatformIcons.menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border/80 bg-card/95 backdrop-blur-xl animate-fade-in">
          <nav className="flex flex-col p-[20px] gap-[4px]">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-[12px] py-[12px] text-sm font-medium hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-[8px] pt-[12px] mt-[8px] border-t border-border">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/login">Access portal</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
