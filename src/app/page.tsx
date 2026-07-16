"use client";

import React from "react";
import Link from "next/link";
import { useTheme, ColorTheme } from "@/components/theme-provider";
import { 
  Building2, 
  Users2, 
  Receipt, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";

export default function LandingPage() {
  const { colorTheme, modeTheme, setColorTheme, setModeTheme } = useTheme();

  const themes: { name: string; value: ColorTheme; bg: string }[] = [
    { name: "Shamrock", value: "shamrock", bg: "bg-emerald-600" },
    { name: "Ocean", value: "ocean", bg: "bg-blue-600" },
    { name: "Violet", value: "violet", bg: "bg-purple-600" },
    { name: "Sunset", value: "sunset", bg: "bg-orange-500" },
    { name: "Rose", value: "rose", bg: "bg-rose-600" },
    { name: "Slate", value: "slate", bg: "bg-slate-600" }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* ─── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center transition-all duration-300">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Rent<span className="text-primary transition-colors duration-200">Flaw</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          </div>

          {/* Theme controls & CTA */}
          <div className="flex items-center space-x-4">
            {/* Mode switch */}
            <button
              onClick={() => setModeTheme(modeTheme === "light" ? "dark" : "light")}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {modeTheme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-primary hover:bg-primary/10 border border-primary/20 transition-all duration-200"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
            >
              Get Started <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────── */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 transition-colors duration-200">
          {/* Decorative gradients */}
          <div className="absolute inset-0 -z-10 bg-radial-gradient from-primary/5 via-transparent to-transparent pointer-events-none transition-colors duration-500" />
          
          <div className="container mx-auto px-6 max-w-6xl text-center">
            {/* Tagline */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse transition-all duration-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Tenant Rental Management Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              Manage Your Rental Business with <span className="text-primary transition-colors duration-200">Absolute Precision</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              RentFlaw is a robust, 3NF fully-normalized platform offering multi-tenant isolation, automated invoice workflows, utility tracking, and custom RBAC permissions.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all duration-200 group"
              >
                Start Free Trial 
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-xl border border-border hover:bg-accent/50 transition-all duration-200">
                Book a Demo
              </button>
            </div>

            {/* ─── LIVE THEME SWITCHER SHOWCASE ─────────── */}
            <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-border bg-card shadow-xl relative overflow-hidden transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <h3 className="text-md font-bold flex items-center gap-1.5 text-foreground">
                    Try the Live Color Switcher
                  </h3>
                  <p className="text-xs text-muted-foreground">Select a palette to transform the entire layout experience.</p>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setColorTheme(t.value)}
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${t.bg} ${
                        colorTheme === t.value 
                          ? "border-foreground ring-2 ring-primary/20 scale-105" 
                          : "border-transparent"
                      }`}
                      title={t.name}
                      aria-label={`Switch to ${t.name} theme`}
                    >
                      {colorTheme === t.value && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features Grid ────────────────────────── */}
        <section id="features" className="py-24 border-t border-border bg-accent/20 transition-colors duration-200">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Built to Scale. Crafted to Perform.
              </h2>
              <p className="text-muted-foreground">
                Eliminate spreadsheets, track active leases, audit manual transaction receipts securely, and keep operations compliant with automated tasks.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Property Hierarchy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Support boarding houses, hostels, and rentals. Model your properties down to floors and individual rentable rooms or bed spaces.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Global Tenant Profiles</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tenants maintain a single global account. Connect tenants across different landlords to maintain a consistent portable rental history.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Automated Billing System</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Set collection dates, grace periods, and late fees. Invoices auto-generate, applying FIFO logic to settle oldest dues first.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Custom RBAC Roles</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empower custom staff roles like managers, accountants, and receptionists. Define fine-grained access limits per staff user.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Utility Consumption</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Meter utility readings (electricity, water) and link computed line-item costs directly into the tenant's monthly invoice.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-colors duration-200">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-3">Security Deposit Audits</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Refund deposits, catalog deductibles, record repair damages, and log complete settlement trails upon agreement termination.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-12 transition-colors duration-200">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors duration-200">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-foreground">RentFlaw</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} RentFlaw. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
