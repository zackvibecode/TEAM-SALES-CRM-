"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";

type BrandLogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: "h-9 w-auto max-w-[140px]",
  md: "h-11 w-auto max-w-[180px]",
  lg: "h-14 w-auto max-w-[220px]",
};

export function BrandLogo({
  size = "md",
  className,
  priority = false,
}: {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
}) {
  const { theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <Image
      src={isDark ? "/zaqone-crm-logo-dark.png" : "/zaqone-crm-logo.png"}
      alt="Zaqone CRM"
      width={3802}
      height={832}
      priority={priority}
      className={cn("object-contain object-left shrink-0", sizeClasses[size], className)}
    />
  );
}
