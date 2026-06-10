"use client";

import { cn } from "@/lib/utils";

interface RotatorCountdownRingProps {
  value: number;
  total?: number;
  size?: "sm" | "md";
  className?: string;
}

/** Centered countdown with pop tick animation each second */
export function RotatorCountdownRing({
  value,
  total = 2,
  size = "md",
  className,
}: RotatorCountdownRingProps) {
  const boxSize =
    size === "sm"
      ? "h-[4.5rem] w-[4.5rem] sm:h-[5rem] sm:w-[5rem]"
      : "h-[5.25rem] w-[5.25rem] sm:h-[6rem] sm:w-[6rem]";

  const fontSize =
    size === "sm"
      ? "text-[2.5rem] sm:text-[2.75rem]"
      : "text-[2.75rem] sm:text-[3.25rem]";

  return (
    <div className={cn("mx-auto w-full flex flex-col items-center justify-center", className)}>
      <div
        className={cn("relative grid place-items-center rounded-full", boxSize)}
        aria-label={`Countdown ${value}`}
      >
        {/* Soft glow */}
        <div className="absolute inset-0 rounded-full bg-[#3b66ff]/10 animate-rotator-count-glow" />

        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#3b66ff]/15" />

        {/* Tick pulse each second */}
        <div
          key={`pulse-${value}`}
          className="absolute inset-0 rounded-full border-[3px] border-[#3b66ff]/50 animate-rotator-count-tick"
        />

        {/* Inner disc — number perfectly centered via grid */}
        <div className="absolute inset-[10%] grid place-items-center rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_rgba(59,102,255,0.12)] ring-1 ring-[#3b66ff]/10">
          <span
            key={value}
            className={cn(
              "font-bold tabular-nums leading-none text-[#3b66ff] animate-rotator-count-pop",
              fontSize
            )}
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {value}
          </span>
        </div>
      </div>

      <p
        className="mt-2.5 text-center text-[10px] sm:text-xs font-medium text-slate-500"
        aria-hidden
      >
        {value > 0 ? `Redirect dalam ${value} detik` : "Sedang redirect..."}
      </p>
    </div>
  );
}
