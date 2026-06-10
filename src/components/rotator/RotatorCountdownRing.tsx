"use client";

import { cn } from "@/lib/utils";

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

interface RotatorCountdownRingProps {
  value: number;
  total?: number;
  size?: "sm" | "md";
  className?: string;
}

/** Mobile-first countdown ring — scales with viewport inside phone & full page */
export function RotatorCountdownRing({
  value,
  total = 2,
  size = "md",
  className,
}: RotatorCountdownRingProps) {
  const progress = Math.max(0, Math.min(1, value / total));
  const offset = RING_C * (1 - progress);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        size === "sm"
          ? "h-[clamp(4.25rem,20vw,5.25rem)] w-[clamp(4.25rem,20vw,5.25rem)]"
          : "h-[clamp(5rem,26vw,6.5rem)] w-[clamp(5rem,26vw,6.5rem)]",
        className
      )}
      aria-label={`Countdown ${value}`}
    >
      <div className="absolute inset-[-6%] rounded-full bg-[#3b66ff]/[0.12] blur-md" />

      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={RING_R}
          fill="none"
          stroke="rgba(59,102,255,0.12)"
          strokeWidth="5"
        />
        <circle
          cx="50"
          cy="50"
          r={RING_R}
          fill="none"
          stroke="#3b66ff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>

      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white/90 shadow-[inset_0_2px_8px_rgba(59,102,255,0.08)] ring-1 ring-[#3b66ff]/15",
          size === "sm" ? "h-[72%] w-[72%]" : "h-[74%] w-[74%]"
        )}
      >
        <span
          className={cn(
            "font-bold tabular-nums leading-none tracking-tight text-[#3b66ff]",
            size === "sm"
              ? "text-[clamp(1.75rem,9vw,2.5rem)]"
              : "text-[clamp(2.25rem,11vw,3.25rem)]"
          )}
          key={value}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
