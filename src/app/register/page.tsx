"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Building2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

type Role = "LANDLORD" | "TENANT";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    global_role: "LANDLORD" as Role,
    tenant_code: "", // only used if TENANT
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        form.global_role === "TENANT"
          ? form
          : { first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password, global_role: form.global_role };

      const res = await api.post("/auth/register", payload);

      // Auto-login after register
      const loginRes = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      const { access_token, user } = loginRes.data;
      login(access_token, user);

      if (user.global_role === "TENANT") {
        router.push("/tenant");
      } else {
        router.push("/landlord/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.50 0.16 185) 0%, oklch(0.50 0.22 264) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Rent<span className="opacity-70">Flaw</span>
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            Start managing<br />your properties<br />
            <span className="opacity-75">today.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            Join thousands of landlords and tenants already using RentFlaw
            to simplify rent collection, agreements, and payments.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "2,400+", label: "Active landlords" },
              { value: "14,000+", label: "Managed rooms" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "< 2min", label: "Avg. setup time" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-xl font-extrabold">{s.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">© 2026 RentFlaw. All rights reserved.</p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-lg">RentFlaw</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground mt-1">Free to get started — no credit card needed</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {(["LANDLORD", "TENANT"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, global_role: r })}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  form.global_role === r
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {r === "LANDLORD" ? "🏢 I'm a Landlord" : "🔑 I'm a Tenant"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">First name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Last name</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
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

            {/* Tenant invite code */}
            {form.global_role === "TENANT" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Landlord Invite Code
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(given by your landlord)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RF-2026-XXXX"
                  value={form.tenant_code}
                  onChange={(e) => setForm({ ...form, tenant_code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Create account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              By registering you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
