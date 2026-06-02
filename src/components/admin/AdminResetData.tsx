"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

const CONFIRM_PHRASE = "RESET ALL";

export function AdminResetData() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setStep(0);
    setPhrase("");
    setError("");
  };

  const handleFinalReset = async () => {
    if (phrase.trim() !== CONFIRM_PHRASE) {
      setError(`You must type "${CONFIRM_PHRASE}" exactly.`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-all-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPhrase: phrase.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Reset failed");
        return;
      }
      close();
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-red-100 glass p-5 flex flex-col sm:flex-row sm:items-center gap-4 bg-red-50/40">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900 text-sm">Danger zone</h3>
            <p className="text-xs text-red-700/90 mt-1 leading-relaxed max-w-xl">
              Permanently delete all leads, campaigns (uploaded files), activity logs, and audit history.
              Sales user accounts are kept. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reset all CRM data
        </button>
      </div>

      {step >= 1 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                {step === 1 ? "Step 1 of 2 — Are you sure?" : "Step 2 of 2 — Final confirmation"}
              </h2>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {step === 1 && (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This will remove <strong>all leads</strong>, <strong>all batches/campaigns</strong>,
                    WhatsApp activity history, and audit logs for the whole team.
                  </p>
                  <p className="text-sm text-red-700 font-medium">
                    Sales accounts will not be deleted, but their task lists will be empty.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={close}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
                    >
                      Yes, continue
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-sm text-slate-600">
                    Type <strong className="text-red-700">{CONFIRM_PHRASE}</strong> below to unlock delete.
                  </p>
                  <input
                    type="text"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder={CONFIRM_PHRASE}
                    className="input-field font-mono"
                    autoComplete="off"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setPhrase(""); setError(""); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalReset}
                      disabled={loading || phrase.trim() !== CONFIRM_PHRASE}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? "Deleting…" : "Permanently delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
