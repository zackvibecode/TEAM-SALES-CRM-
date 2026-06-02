"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configHint, setConfigHint] = useState("");
  const [checking, setChecking] = useState(true);
  const [serverOk, setServerOk] = useState(false);

  useEffect(() => {
    async function checkSession() {
      setError("");
      setConfigHint("");

      try {
        const healthRes = await fetch("/api/health", { cache: "no-store" });
        const health = await healthRes.json();
        setServerOk(health.ok === true);

        if (!health.ok) {
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
        setError("Cannot reach server. Wait for Vercel deploy to finish, then refresh.");
        setServerOk(false);
      }
      setChecking(false);
    }
    checkSession();
  }, [router]);

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
        <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-shell px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-5">
            <div className="w-20 h-20 rounded-3xl glass-strong flex items-center justify-center">
              <span className="text-3xl font-extrabold text-blue-600">Z</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Zaqone CRM</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">by Zack · Sales workspace</p>
        </div>

        <form onSubmit={handleLogin} className="glass-strong rounded-3xl p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">Access your dashboard</p>
          </div>

          {configHint && (
            <div className="alert-error text-sm leading-relaxed">
              <strong>Setup Vercel:</strong> {configHint}
            </div>
          )}

          {error && <div className="alert-error">{error}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
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
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="input-field pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !serverOk}
            className="btn-primary-solid w-full py-3.5 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {serverOk && (
            <p className="text-xs text-emerald-700 text-center">Server connected — you can sign in.</p>
          )}
        </form>

        <p className="text-center text-slate-400 text-xs mt-8">Internal use only · Zaqone CRM</p>
      </div>
    </div>
  );
}
