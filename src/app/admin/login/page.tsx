"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Shield, Eye, EyeOff, Loader2, ArrowRight, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      const { access_token, user } = res.data;

      // Verify that this is a SaaS Admin user
      if (user.global_role !== "SAAS_ADMIN") {
        setError("Access Denied: This login is restricted to SaaS administrators only.");
        setLoading(false);
        return;
      }

      // Store token + user in Zustand
      login(access_token, user);
      router.push("/admin/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-background transition-colors duration-200"
      style={{
        background: "radial-gradient(circle at top, oklch(0.20 0.08 280) 0%, oklch(0.12 0.03 280) 100%)",
      }}
    >
      <div className="w-full max-w-[420px] bg-card/65 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Brand/Shield Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Rent<span className="text-primary">Flaw</span>
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              SaaS Admin Control Center
            </p>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex gap-2.5 p-3.5 bg-white/5 border border-white/15 text-white/80 rounded-sm text-xs">
          <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 text-amber-400" />
          <p className="leading-normal">
            <strong className="text-white">Security Warning:</strong> Authorized administrative access only. System activities are monitored.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@rentflaw.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-background/50 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Admin Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-white/10 bg-background/50 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Authenticate Admin <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-white transition-colors">
            Return to standard portal login
          </Link>
        </div>
      </div>
    </div>
  );
}
