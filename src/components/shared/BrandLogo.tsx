import Image from "next/image";
import { cn } from "@/lib/utils";

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
  return (
    <Image
      src="/zaqone-crm-logo.png"
      alt="Zaqone CRM"
      width={320}
      height={64}
      priority={priority}
      className={cn("object-contain object-left", sizeClasses[size], className)}
    />
  );
}
