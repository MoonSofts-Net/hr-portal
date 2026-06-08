"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type RevealAnimation = "up" | "down" | "left" | "right" | "scale" | "fade";

const HIDDEN: Record<RevealAnimation, string> = {
  up: "opacity-0 translate-y-[28px]",
  down: "opacity-0 -translate-y-[28px]",
  left: "opacity-0 -translate-x-[28px]",
  right: "opacity-0 translate-x-[28px]",
  scale: "opacity-0 scale-[0.96]",
  fade: "opacity-0",
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  animation?: RevealAnimation;
  delay?: number;
  duration?: number;
  /** Play on mount (hero) instead of waiting for scroll */
  immediate?: boolean;
  once?: boolean;
  threshold?: number;
  as?: ElementType;
}

export function Reveal({
  children,
  className,
  animation = "up",
  delay = 0,
  duration = 700,
  immediate = false,
  once = true,
  threshold = 0.12,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(immediate || reducedMotion);

  useEffect(() => {
    if (immediate || reducedMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, once, reducedMotion, threshold]);

  const style = reducedMotion
    ? undefined
    : {
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      };

  return (
    <Tag
      ref={ref}
      className={cn(
        "motion-safe:transition-[opacity,transform] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : HIDDEN[animation],
        className
      )}
      style={style}
    >
      {children}
    </Tag>
  );
}
