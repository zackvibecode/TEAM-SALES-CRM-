"use client";

import { cn } from "@/lib/utils";

interface RotatorContentFrameProps {
  children: React.ReactNode;
  className?: string;
}

/** Curved soft frame around landing content / image */
export function RotatorContentFrame({ children, className }: RotatorContentFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-[1.75rem] border border-white/80 bg-white/70 p-3 shadow-[0_8px_30px_rgba(37,99,235,0.08)] backdrop-blur-sm",
        "ring-1 ring-[#2563eb]/10",
        className
      )}
    >
      <div className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-[#2563eb]/[0.07] via-transparent to-blue-400/[0.05]" />
      <div className="relative">{children}</div>
    </div>
  );
}
