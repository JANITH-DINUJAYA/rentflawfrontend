"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { KeyRound, Eye, EyeOff, Loader2, ArrowRight, FileText, FileSignature, HelpCircle } from "lucide-react";

export default function TenantLoginPage() {
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

      // Only allow TENANT role
      if (user.global_role !== "TENANT") {
        setError("Access Denied: This portal is for tenants only. Landlords please use the Landlord Portal.");
        setLoading(false);
        return;
      }

      login(access_token, user);
      router.push("/tenant");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Brand Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, oklch(0.20 0.06 185) 0%, oklch(0.50 0.16 185) 100%)",
        }}
      >
        {/* Subtle circle blobs for depth */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Rent<span className="opacity-70">Flaw</span>
            <span className="ml-2 text-[11px] font-bold bg-white/15 px-2 py-0.5 rounded-full">Home</span>
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            Your home,<br />your way.<br />
            <span className="opacity-75">Simplified.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            View your invoices, submit payments, check your rental agreement, and raise maintenance requests — all in one place.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: FileText, label: "View Invoices" },
              { icon: FileSignature, label: "Rental Agreement" },
              { icon: HelpCircle, label: "Support Tickets" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">© 2026 RentFlaw. All rights reserved.</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[400px] space-y-7">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.50 0.16 185)" }}>
              <KeyRound className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg">RentFlaw <span className="text-muted-foreground font-normal text-sm">Home</span></span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Tenant Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to view your home, invoices, and payments</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">Password</label>
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
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg"
              style={{ background: "oklch(0.50 0.16 185)", boxShadow: "0 4px 20px oklch(0.50 0.16 185 / 30%)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in to My Home <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="space-y-3 text-sm text-center text-muted-foreground">
            <p>
              New tenant?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
            </p>
            <div className="flex items-center gap-2 justify-center text-xs">
              <div className="h-px w-12 bg-border" />
              <span>Other portals</span>
              <div className="h-px w-12 bg-border" />
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <Link href="/landlord/login" className="text-muted-foreground hover:text-primary transition-colors">🏢 Landlord Login</Link>
              <Link href="/admin/login" className="text-muted-foreground hover:text-primary transition-colors">🛡 Admin Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
