"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Copy,
  KeyRound,
  RefreshCw,
  Check,
  Shield,
  Link2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ApiKeyInfo = {
  configured: boolean;
  source: "database" | "environment" | "none";
  masked: string | null;
  updated_at: string | null;
  baseUrl: string;
  headerHint: string;
  endpoints: { method: string; path: string; description: string }[];
  importantNotes?: string[];
  exampleCurl?: string;
  exampleUrlWithQuery?: string;
};

type CopyTarget = "key" | "curl" | "url" | null;

export function AdminAgentApiKeyPanel() {
  const [info, setInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyTarget>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(false);

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

  const flashCopied = (target: CopyTarget) => {
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyText = async (text: string, target: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(target);
    } catch {
      setError("Gagal salin — salin manual.");
    }
  };

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
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menjana key");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card-padded animate-pulse h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-padded-sm animate-pulse h-24 rounded-2xl" />
          <div className="card-padded-sm animate-pulse h-24 rounded-2xl" />
          <div className="card-padded-sm animate-pulse h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statusLabel = info?.configured ? "Aktif" : "Belum dijana";
  const statusTone = info?.configured ? "text-emerald-600" : "text-amber-600";

  return (
    <>
      <div className="space-y-5">
        {/* Hero card */}
        <div className="card-padded overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 100% 0%, #3b66ff 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, #6366f1 0%, transparent 50%)",
            }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="icon-stat w-12 h-12 shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-xl" style={{ color: "var(--text-primary)" }}>
                    AI Sales Monitor
                  </h2>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: "var(--surface-elevated)", color: "var(--text-muted)" }}
                  >
                    Read-only API
                  </span>
                </div>
                <p className="text-sm mt-2 max-w-xl leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Jana API key supaya Hermes, Telegram bot, atau AI lain boleh baca prestasi sales
                  team. Admin sahaja — jangan kongsi dengan sales.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn-primary-solid shrink-0 min-h-[48px] px-6 text-base"
            >
              <Sparkles className="w-4 h-4" />
              {info?.configured ? "Jana Key Baru" : "Jana API Key"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-padded-sm">
            <div className="flex items-center gap-3">
              <div className="icon-stat w-9 h-9">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="stat-label text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Status Key
                </p>
                <p className={`stat-value text-lg font-bold mt-0.5 ${statusTone}`}>{statusLabel}</p>
              </div>
            </div>
            {info?.masked && (
              <p className="mt-3 font-mono text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {info.masked}
              </p>
            )}
            {info?.source === "environment" && (
              <p className="mt-2 text-xs text-amber-600">
                Key dari Vercel. Jana di sini untuk urus dari dashboard.
              </p>
            )}
          </div>

          <div className="card-padded-sm">
            <div className="flex items-center gap-3">
              <div className="icon-stat w-9 h-9">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <p className="stat-label text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Kemas Kini
                </p>
                <p className="stat-value text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  {info?.updated_at
                    ? new Date(info.updated_at).toLocaleString("ms-MY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="card-padded-sm">
            <div className="flex items-center gap-3">
              <div className="icon-stat w-9 h-9">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="stat-label text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Endpoint
                </p>
                <p className="stat-value text-lg font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  {info?.endpoints?.length ?? 0} route
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CRM URL */}
        <div className="card-padded-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                CRM Base URL
              </p>
              <p className="font-mono text-sm mt-1 break-all" style={{ color: "var(--text-primary)" }}>
                {info?.baseUrl ?? "—"}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Header: <code className="text-xs">X-API-Key</code> atau{" "}
                <code className="text-xs">Authorization: Bearer</code>
              </p>
            </div>
            {info?.baseUrl && (
              <button
                type="button"
                onClick={() => copyText(info.baseUrl, "url")}
                className="btn-secondary shrink-0 min-h-[40px]"
              >
                {copied === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === "url" ? "Disalin" : "Salin URL"}
              </button>
            )}
          </div>
        </div>

        {/* New key reveal */}
        {newKey && (
          <div
            className="card-padded border-2"
            style={{ borderColor: "rgba(16, 185, 129, 0.35)", background: "rgba(16, 185, 129, 0.06)" }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    API Key berjaya dijana!
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Salin sekarang — key penuh hanya dipaparkan sekali.
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 font-mono text-sm break-all"
                  style={{ background: "var(--surface-muted)", color: "var(--text-primary)" }}
                >
                  {newKey}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(newKey, "key")}
                    className="btn-primary-solid min-h-[44px]"
                  >
                    {copied === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === "key" ? "Disalin!" : "Salin API Key"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `curl -H "X-API-Key: ${newKey}" ${info?.baseUrl}/api/agent/sales-users`,
                        "curl"
                      )
                    }
                    className="btn-secondary min-h-[44px]"
                  >
                    {copied === "curl" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Salin contoh curl
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="card-padded-sm border border-red-200 bg-red-50/80 dark:bg-red-950/30 dark:border-red-900/50">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Telegram troubleshooting */}
        <div
          className="card-padded-sm border-2"
          style={{ borderColor: "rgba(59, 102, 255, 0.25)", background: "rgba(59, 102, 255, 0.04)" }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Untuk Hermes / Telegram — penting!
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {(info?.importantNotes ?? [
              "Token zaqone_* = CRM API key. Bukan Vercel bypass. Bukan login admin.",
              "Guna https://salescrm.zaqone.com/api/agent/... — jangan buka halaman web.",
            ]).map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-[#3b66ff] shrink-0">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
          {info?.exampleUrlWithQuery && (
            <p className="mt-3 text-xs font-mono break-all p-3 rounded-lg" style={{ background: "var(--surface-muted)", color: "var(--text-secondary)" }}>
              {newKey
                ? info.exampleUrlWithQuery.replace("YOUR_KEY", newKey)
                : info.exampleUrlWithQuery.replace("YOUR_KEY", "zaqone_...")}
            </p>
          )}
        </div>

        {/* Quick guide */}
        <div className="card-padded-sm">
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Setup Hermes Telegram (5 langkah)
          </p>
          <ol className="space-y-2 text-sm list-decimal list-inside" style={{ color: "var(--text-muted)" }}>
            <li>Salin API key <code className="text-xs">zaqone_*</code> di atas</li>
            <li>
              Edit <code className="text-xs">C:\Users\User\AppData\Local\hermes\.env</code>
            </li>
            <li>
              <code className="text-xs">ZAQONE_CRM_URL=https://salescrm.zaqone.com</code>
              <br />
              <code className="text-xs">ZAQONE_API_KEY=zaqone_...</code>
            </li>
            <li>Restart: <code className="text-xs">hermes gateway install</code></li>
            <li>Telegram: &quot;Berapa hari SHIEMA aktif 30 hari lepas?&quot;</li>
          </ol>
        </div>

        {/* Endpoints collapsible */}
        {info?.endpoints && info.endpoints.length > 0 && (
          <div className="card-padded-sm">
            <button
              type="button"
              onClick={() => setShowEndpoints((v) => !v)}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Senarai Endpoint API
              </span>
              {showEndpoints ? (
                <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              )}
            </button>
            {showEndpoints && (
              <div className="mt-4 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--surface-muted)" }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>
                        Method
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>
                        Path
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.endpoints.map((ep) => (
                      <tr key={ep.path} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#3b66ff]/15 text-[#3b66ff]">
                            {ep.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                          {ep.path}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                          {ep.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="card w-full max-w-md overflow-hidden shadow-2xl">
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {info?.configured ? "Jana key baru?" : "Jana API key"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {info?.configured
                  ? "Key lama akan tidak sah. Kemas kini Hermes/Telegram dengan key baru selepas ini."
                  : "Key akan disimpan selamat dalam database CRM. Hanya admin boleh jana."}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 min-h-[44px]">
                  Batal
                </button>
                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerate}
                  className="btn-primary-solid flex-1 min-h-[44px]"
                >
                  <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Menjana…" : "Ya, jana"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
