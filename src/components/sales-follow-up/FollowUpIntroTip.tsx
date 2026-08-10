"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X, Plus, Eye } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

const STORAGE_KEY = "sales-follow-up-intro-dismissed-v1";

export function FollowUpIntroTip() {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="rounded-xl border px-4 py-4 sm:px-5"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--surface-muted)", color: "var(--text-secondary)" }}
        >
          <Lightbulb className="size-4" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {sf.tipTitle}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="p-1 rounded-lg hover:bg-[var(--surface-muted)] transition"
              style={{ color: "var(--text-muted)" }}
              aria-label={sf.tipClose}
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {sf.tipBody}
          </p>

          <ul className="text-sm space-y-1.5" style={{ color: "var(--text-secondary)" }}>
            <li>{sf.tipGrey}</li>
            <li>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{sf.tipYellow}</span>
            </li>
            <li>
              <span className="font-semibold text-orange-700 dark:text-orange-400">{sf.tipOrange}</span>
            </li>
            <li>
              <span className="font-semibold text-green-700 dark:text-green-400">{sf.tipGreen}</span>
            </li>
          </ul>

          <div
            className="rounded-lg px-3 py-2.5 text-sm space-y-1.5"
            style={{ backgroundColor: "var(--surface-muted)", color: "var(--text-secondary)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {sf.tipActions}
            </p>
            <p className="flex items-center gap-2">
              <Plus className="size-3.5 shrink-0" />
              <span>{sf.tipFollowUp}</span>
            </p>
            <p className="flex items-center gap-2">
              <Eye className="size-3.5 shrink-0" />
              <span>{sf.tipView}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
