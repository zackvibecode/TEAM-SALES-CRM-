"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, KeyRound, RefreshCw, Check } from "lucide-react";

type ApiKeyInfo = {
  configured: boolean;
  source: "database" | "environment" | "none";
  masked: string | null;
  updated_at: string | null;
  baseUrl: string;
  headerHint: string;
  endpoints: { method: string; path: string; description: string }[];
};

export function AdminAgentApiKeyPanel() {
  const [info, setInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agent-api-key", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuatkan");
      setInfo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuatkan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setNewKey(null);
    try {
      const res = await fetch("/api/admin/agent-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjana key");
      setNewKey(data.apiKey);
      setShowConfirm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menjana key");
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal salin — salin manual dari kotak di bawah.");
    }
  };

  const copyCurl = async () => {
    if (!newKey || !info?.baseUrl) return;
    const curl = `curl -H "X-API-Key: ${newKey}" ${info.baseUrl}/api/agent/sales-users`;
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal salin curl.");
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">AI API Key</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Key untuk Hermes, Telegram bot, atau AI lain baca data sales (read-only). Admin
            sahaja — jangan kongsi dengan sales team.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Memuatkan…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Status
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                {info?.configured ? "Aktif" : "Belum dijana"}
              </p>
              {info?.masked && (
                <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">{info.masked}</p>
              )}
              {info?.source === "environment" && (
                <p className="mt-2 text-xs text-amber-500">
                  Key dari Vercel env var. Jana key baru di sini untuk urus dari dashboard.
                </p>
              )}
              {info?.updated_at && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Dikemas kini: {new Date(info.updated_at).toLocaleString("ms-MY")}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                CRM URL
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--foreground)] break-all">
                {info?.baseUrl ?? "—"}
              </p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">{info?.headerHint}</p>
            </div>
          </div>

          {newKey && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-400">
                Key baru — salin sekarang! Key penuh hanya dipaparkan sekali.
              </p>
              <code className="block break-all rounded-lg bg-black/30 p-3 text-xs text-[var(--foreground)]">
                {newKey}
              </code>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyKey}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Disalin!" : "Salin Key"}
                </button>
                <button
                  type="button"
                  onClick={copyCurl}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--accent)]"
                >
                  Salin contoh curl
                </button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Untuk Hermes Telegram: letak dalam{" "}
                <code className="text-[var(--foreground)]">ZAQONE_API_KEY</code> dalam fail .env
                Hermes, kemudian restart gateway.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <KeyRound className="h-4 w-4" />
              {info?.configured ? "Jana Key Baru" : "Jana API Key"}
            </button>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
              <p className="text-sm text-amber-200">
                {info?.configured
                  ? "Key lama akan tidak sah. Hermes/Telegram perlu dikemas kini dengan key baru."
                  : "Key akan disimpan dalam database CRM."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Menjana…" : "Ya, jana key"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {info?.endpoints && info.endpoints.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Endpoint (read-only)
              </p>
              <ul className="space-y-2">
                {info.endpoints.map((ep) => (
                  <li
                    key={ep.path}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  >
                    <p className="font-mono text-xs text-violet-300">
                      {ep.method} {ep.path}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">{ep.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
