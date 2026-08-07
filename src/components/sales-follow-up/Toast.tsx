"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <Check className="size-4" />,
  error: <X className="size-4" />,
  info: <Info className="size-4" />,
};

const COLORS: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400",
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, 3500);
    return () => clearTimeout(timer);
  }, [handleRemove]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-200 text-sm font-medium",
        COLORS[toast.type],
        exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      )}
    >
      {ICONS[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button onClick={handleRemove} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return {
    toasts,
    toast: add,
    removeToast: remove,
  };
}
