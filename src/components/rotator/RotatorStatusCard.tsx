"use client";

import { AlertCircle, Users, Link2, WifiOff } from "lucide-react";
import { RotatorSceneBackground } from "./RotatorSceneBackground";
import { RotatorContentFrame } from "./RotatorContentFrame";

type StatusVariant = "unavailable" | "not_found" | "inactive" | "error";

const VARIANT_CONFIG: Record<
  StatusVariant,
  { icon: typeof AlertCircle; iconBg: string; iconColor: string; title: string }
> = {
  unavailable: {
    icon: Users,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Team Tidak Tersedia",
  },
  not_found: {
    icon: Link2,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    title: "Link Tidak Dijumpai",
  },
  inactive: {
    icon: AlertCircle,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    title: "Link Tidak Aktif",
  },
  error: {
    icon: WifiOff,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Ralat Sambungan",
  },
};

interface RotatorStatusCardProps {
  variant: StatusVariant;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Polished framed status for public rotator errors */
export function RotatorStatusCard({
  variant,
  message,
  onRetry,
  retryLabel = "Cuba Lagi",
}: RotatorStatusCardProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <RotatorSceneBackground className="min-h-screen min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 py-10">
      <RotatorContentFrame className="w-full max-w-sm p-6 sm:p-8 text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconBg} ring-4 ring-white/80`}
        >
          <Icon className={`h-8 w-8 ${config.iconColor}`} strokeWidth={1.75} />
        </div>

        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">{config.title}</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 w-full rounded-full bg-[#3b66ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(59,102,255,0.55)] transition hover:bg-[#2f55e0]"
          >
            {retryLabel}
          </button>
        )}
      </RotatorContentFrame>
    </RotatorSceneBackground>
  );
}

export function errorToVariant(error: string): StatusVariant {
  if (error === "page_not_found" || error.includes("tidak dijumpai")) return "not_found";
  if (error === "page_inactive" || error.includes("tidak aktif")) return "inactive";
  if (error === "no_active_sales" || error.includes("tidak tersedia")) return "unavailable";
  return "error";
}
