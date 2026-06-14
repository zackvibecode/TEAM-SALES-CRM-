"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BellNotification() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20&unread=true");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.entity_type === "promo") {
      router.push("/dashboard/sales/promos");
    }
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 rounded-md hover:bg-[var(--surface-hover)] shrink-0"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: "#ef4444" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border shadow-xl z-50 overflow-hidden"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: "var(--border-color)" }}>
            <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Notifikasi
              {unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
                  ({unreadCount})
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-medium hover:underline"
                style={{ color: "#3b66ff" }}
              >
                <CheckCheck className="w-3 h-3 inline mr-0.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-3.5 py-10 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-25" style={{ color: "var(--text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tiada notifikasi
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-3.5 py-3 hover:bg-[var(--surface-hover)] transition-colors border-b last:border-b-0"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "#3b66ff" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-[11px] leading-snug mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    <X
                      className="w-3 h-3 shrink-0 mt-1 opacity-50 hover:opacity-100"
                      style={{ color: "var(--text-muted)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
