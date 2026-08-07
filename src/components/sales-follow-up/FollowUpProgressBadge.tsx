"use client";

import { cn } from "@/lib/utils";

interface FollowUpProgressBadgeProps {
  count: number;
  size?: "sm" | "md";
}

export function FollowUpProgressBadge({ count, size = "md" }: FollowUpProgressBadgeProps) {
  let label: string;
  let colorClass: string;

  if (count === 0) {
    label = "Belum Follow-Up";
    colorClass = "bg-[var(--surface-muted)]";
  } else if (count === 1) {
    label = "1 / 3";
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
  } else if (count === 2) {
    label = "2 / 3";
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
  } else if (count === 3) {
    label = "3 / 3 Selesai";
    colorClass = "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
  } else {
    label = `${count} Follow-Ups`;
    colorClass = "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        colorClass
      )}
    >
      {label}
    </span>
  );
}

export function FollowUpStatusLabel({ count }: { count: number }) {
  if (count === 0) return "Belum Follow-Up";
  if (count === 1) return "1 Kali Follow-Up";
  if (count === 2) return "2 Kali Follow-Up";
  return "Minimum 3 Kali Selesai";
}
