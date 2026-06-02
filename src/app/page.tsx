"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    async function checkSession() {
      setConfigured(isSupabaseConfigured());

      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (!data.configured) {
          setConfigured(false);
          setChecking(false);
          return;
        }
        if (data.user && data.role) {
          router.replace(data.role === "admin" ? "/admin/dashboard" : "/dashboard/sales");
          return;
        }
      } catch {
        setError("Cannot reach server. Check your connection or redeploy Vercel.");
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
      if (message === "Failed to fetch") {
        setError(
          "Cannot connect to server. If this is the live site, open /api/health — Supabase env may be missing on Vercel."
        );
      } else {
        setError(message);
      }
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

          {!configured && (
            <div className="alert-error">
              Supabase not configured on this deployment. In Vercel → Settings → Environment
              Variables, add the 3 Supabase keys, then <strong>Redeploy</strong>.
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
                placeholder="you@example.com"
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
            disabled={loading || !configured}
            className="btn-primary-solid w-full py-3.5 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-8">Internal use only · Zaqone CRM</p>
      </div>
    </div>
  );
}
