"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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
      } catch {
        setError(login.networkError);
        setServerOk(false);
        setChecking(false);
        return;
      }

      try {
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
        // Session check failed — still allow manual login.
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

      const destination = data.role === "admin" ? "/admin/dashboard" : "/dashboard/sales";
      window.location.assign(destination);
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
        <div className="w-10 h-10 rounded-full border-[3px] border-[#9fe870] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-shell">
      <div className="m-container max-w-lg w-full mx-auto pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:text-[#2e6b1c] dark:hover:text-[#9fe870]"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          {login.backHome.replace(/^←\s*/, "")}
        </Link>
        <LangToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="relative w-full max-w-[440px]">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-2">
              <BrandLogo size="lg" priority />
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="m-card p-7 sm:p-9 space-y-6 shadow-[0_24px_48px_-24px_rgba(22,51,0,0.18)]"
          >
            <div>
              <h2 className="m-h3 !text-2xl">{login.title}</h2>
              <p className="m-muted mt-1.5">{login.subtitle}</p>
            </div>

            {configHint && (
              <div className="alert-error leading-relaxed">
                <strong>{login.configErrorPrefix}</strong> {configHint}
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {login.email}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@nusatravel.com"
                  className="input-field !pl-11"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {login.password}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field !pl-11 !pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-full transition hover:bg-[var(--surface-muted)]"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !serverOk}
              className="btn-primary-solid w-full disabled:opacity-50"
            >
              {loading ? login.submitting : login.submit}
            </button>

            {serverOk && (
              <p className="text-xs font-semibold text-center" style={{ color: "#4f9e2c" }}>
                {login.serverOk}
              </p>
            )}
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "var(--text-muted)" }}>
            {login.noAccount}{" "}
            <a
              href={contactUrl}
              className="font-bold transition hover:underline"
              style={{ color: "#2e6b1c" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {login.contactSales}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
