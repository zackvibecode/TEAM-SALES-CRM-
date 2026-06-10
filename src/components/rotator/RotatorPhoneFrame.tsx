"use client";

import { RotatorSceneBackground } from "./RotatorSceneBackground";

interface RotatorPhoneFrameProps {
  children: React.ReactNode;
}

/** Curved phone mockup frame for admin preview */
export function RotatorPhoneFrame({ children }: RotatorPhoneFrameProps) {
  return (
    <div className="relative mx-auto w-full max-w-[290px]">
      {/* Outer glow ring */}
      <div className="absolute -inset-3 rounded-[2.75rem] bg-gradient-to-br from-[#3b66ff]/20 via-transparent to-emerald-300/20 blur-md" />

      {/* Device shell — deep curve */}
      <div className="relative rounded-[2.5rem] border-[7px] border-slate-900 bg-slate-900 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.45)] overflow-hidden">
        {/* Dynamic island */}
        <div className="relative z-20 flex justify-center pt-3 pb-1 bg-slate-900">
          <div className="h-[22px] w-[88px] rounded-full bg-black/90 ring-1 ring-white/10" />
        </div>

        {/* Screen — curved inner clip */}
        <div className="relative bg-[#fafbfd] overflow-hidden rounded-b-[2rem]">
          <RotatorSceneBackground className="min-h-[500px]">
            <div className="flex min-h-[500px] flex-col items-center justify-center px-5 py-10">
              {children}
            </div>
          </RotatorSceneBackground>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center bg-slate-900 py-2.5">
          <div className="h-1 w-24 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}
