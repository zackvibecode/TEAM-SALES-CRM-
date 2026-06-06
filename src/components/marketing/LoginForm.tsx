"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { getSalesContactUrl } from "@/lib/marketing/contact";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { LangToggle } from "./LangToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function LoginForm() {
  const router = useRouter();
  const { copy } = useMarketingLocale();
  const login = copy.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configHint, setConfigHint] = useState("");
  const [checking, setChecking] = useState(true);
  const [serverOk, setServerOk] = useState(false);
  const contactUrl = getSalesContactUrl();

  useEffect(() => {
    async function checkSession() {
      setError("");
      setConfigHint("");

      try {
        const healthRes = await fetch("/api/health", { cache: "no-store" });
        const health = await healthRes.json();
        const canLogin = health.loginOk === true || health.ok === true;
        setServerOk(canLogin);

        if (!canLogin) {
          const msg =
            health.hints?.join(" ") ||
            health.hint ||
            "Supabase env missing on Vercel. Add 3 keys (Legacy anon + service_role), then Redeploy.";
          setConfigHint(msg);
          setChecking(false);
          return;
        }

        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (data.user && data.role) {
          router.replace(data.role === "admin" ? "/admin/dashboard" : "/dashboard/sales");
          return;
        }
      } catch {
        setError(login.networkError);
        setServerOk(false);
      }
      setChecking(false);
    }
    checkSession();
  }, [router, login.networkError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.replace(data.role === "admin" ? "/admin/dashboard" : "/dashboard/sales");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center app-shell">
        <div className="w-10 h-10 rounded-full border-2 border-[#3b66ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-shell">
      <div className="max-w-md w-full mx-auto px-4 pt-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold hover:text-[#3b66ff] transition" style={{ color: "var(--text-muted)" }}>
          {login.backHome}
        </Link>
        <LangToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-2">
              <BrandLogo size="lg" priority />
            </div>
          </div>

          <form onSubmit={handleLogin} className="card-padded-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {login.title}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {login.subtitle}
              </p>
            </div>

            {configHint && (
              <div className="alert-error text-sm leading-relaxed">
                <strong>{login.configErrorPrefix}</strong> {configHint}
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {login.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3b66ff]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@nusatravel.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {login.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3b66ff]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !serverOk}
              className="btn-primary-solid w-full py-3.5 disabled:opacity-50"
            >
              {loading ? login.submitting : login.submit}
            </button>

            {serverOk && (
              <p className="text-xs text-emerald-600 text-center">{login.serverOk}</p>
            )}
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "var(--text-muted)" }}>
            {login.noAccount}{" "}
            <a href={contactUrl} className="font-semibold text-[#3b66ff] hover:underline" target="_blank" rel="noopener noreferrer">
              {login.contactSales}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
