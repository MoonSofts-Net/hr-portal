import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { width: 130, height: 44, className: "max-h-[44px]" },
  md: { width: 170, height: 56, className: "max-h-[56px]" },
  lg: { width: 240, height: 80, className: "max-h-[80px]" },
} as const;

interface BrandLogoProps {
  href?: string;
  size?: keyof typeof SIZES;
  className?: string;
  logoClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  /** Use "dark" when logo sits on navy sidebar / dark panels */
  theme?: "light" | "dark";
  onClick?: () => void;
}

export function BrandLogo({
  href,
  size = "md",
  className,
  logoClassName,
  subtitle,
  subtitleClassName,
  theme = "light",
  onClick,
}: BrandLogoProps) {
  const dims = SIZES[size];

  const content = (
    <div className={cn("flex min-w-0 flex-col gap-[3px] sm:gap-[4px]", className)}>
      <Image
        src="/brand/logo.png"
        alt="Armazém Coral Achaqui — Materiais de Construção"
        width={dims.width}
        height={dims.height}
        className={cn("w-auto object-contain object-left", dims.className, logoClassName)}
        priority
      />
      {subtitle && (
        <span
          className={cn(
            "truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em]",
            theme === "dark"
              ? "text-[white]/80"
              : "text-[hsl(var(--muted-foreground))]",
            subtitleClassName
          )}
        >
          {subtitle}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
