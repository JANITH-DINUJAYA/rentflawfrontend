"use client";

import React from "react";
import Link from "next/link";
import { Building2, KeyRound, Shield, ArrowRight } from "lucide-react";

const portals = [
  {
    href: "/landlord/login",
    icon: Building2,
    name: "Landlord Portal",
    sub: "Pro",
    description: "Manage properties, tenants, invoices, payments, and agreements.",
    badge: "LANDLORD",
    gradient: "linear-gradient(135deg, oklch(0.18 0.04 264) 0%, oklch(0.50 0.22 264) 100%)",
    glow: "oklch(0.50 0.22 264 / 25%)",
    hoverBorder: "hover:border-blue-500/40",
  },
  {
    href: "/tenant/login",
    icon: KeyRound,
    name: "Tenant Portal",
    sub: "Home",
    description: "View invoices, submit payments, track your rental agreement, and raise support tickets.",
    badge: "TENANT",
    gradient: "linear-gradient(135deg, oklch(0.20 0.06 185) 0%, oklch(0.50 0.16 185) 100%)",
    glow: "oklch(0.50 0.16 185 / 25%)",
    hoverBorder: "hover:border-teal-500/40",
  },
];

export default function PortalSelectorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            Rent<span className="text-primary">Flaw</span>
          </span>
        </div>
        <Link
          href="/register"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Create an account →
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center space-y-2 mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Choose your portal
          </h1>
          <p className="text-muted-foreground max-w-md text-sm">
            Select the portal that matches your role to access your personalised dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.href}
                href={portal.href}
                className={`group relative flex flex-col p-6 rounded-2xl border border-border bg-card hover:bg-accent/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${portal.hoverBorder} cursor-pointer`}
                style={{
                  ["--glow" as any]: portal.glow,
                  boxShadow: "0 0 0 transparent",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${portal.glow}`)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.boxShadow = "none")
                }
              >
                {/* Portal Icon */}
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg"
                  style={{ background: portal.gradient }}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Badge */}
                <span
                  className="absolute top-5 right-5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                  style={{ background: portal.gradient }}
                >
                  {portal.badge}
                </span>

                <div className="flex-1 space-y-1.5 mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="text-base font-extrabold text-foreground">{portal.name}</h2>
                    <span className="text-xs text-muted-foreground font-medium">{portal.sub}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  Sign in <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-muted-foreground">
        © 2026 RentFlaw · Global Rental Management Platform
      </footer>
    </div>
  );
}
