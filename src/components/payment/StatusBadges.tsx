"use client";

import { cn } from "@/lib/utils";
import type { PaymentStatus, SubscriptionStatus } from "@/types/payment";

const SUB_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  payment_pending: "Payment Pending",
  unpaid: "Unpaid",
};

const PAY_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const SUB_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-success-50 text-success-600",
  expiring_soon: "bg-warning-50 text-warning-600",
  expired: "bg-error-50 text-error-600",
  payment_pending: "bg-brand-100 text-brand-950",
  unpaid: "bg-gray-100 text-gray-600",
};

const PAY_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-success-50 text-success-600",
  pending: "bg-warning-50 text-warning-600",
  failed: "bg-error-50 text-error-600",
  cancelled: "bg-gray-100 text-gray-600",
  rejected: "bg-error-50 text-error-600",
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        SUB_STYLES[status],
        className
      )}
    >
      {SUB_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        PAY_STYLES[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {PAY_LABELS[status] ?? status}
    </span>
  );
}
