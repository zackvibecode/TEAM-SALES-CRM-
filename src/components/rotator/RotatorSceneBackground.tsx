"use client";

interface RotatorSceneBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/** Soft white scenic layout — subtle curves & glow, not plain flat white */
export function RotatorSceneBackground({ children, className = "" }: RotatorSceneBackgroundProps) {
  return (
    <div className={`relative min-h-full w-full overflow-hidden bg-[#fafbfd] ${className}`}>
      {/* Top arc wash */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[140%] -translate-x-1/2 rounded-[100%] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,102,255,0.09) 0%, rgba(59,102,255,0.02) 55%, transparent 72%)",
        }}
      />

      {/* Soft side blobs */}
      <div className="pointer-events-none absolute -left-16 top-1/4 h-56 w-56 rounded-full bg-[#3b66ff]/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-1/4 h-48 w-48 rounded-full bg-emerald-400/[0.07] blur-3xl" />

      {/* Bottom wave curve */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full text-white/80"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,64 C240,110 480,20 720,56 C960,92 1200,36 1440,72 L1440,120 L0,120 Z"
        />
      </svg>
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-white/60 to-transparent" />

      {/* Fine dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 0.6px, transparent 0.6px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
