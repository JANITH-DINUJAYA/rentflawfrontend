"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Crown,
  CheckCircle2,
  Star,
  Zap,
  Building2,
  Users,
  FileText,
  Headphones,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: "month" | "year";
  maxProperties: number;
  maxTenants: number;
  maxStaff: number;
  features: string[];
  badge?: string;
  badgeColor?: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    billingCycle: "month",
    maxProperties: 1,
    maxTenants: 10,
    maxStaff: 1,
    features: ["1 property", "Up to 10 tenants", "1 staff member", "Basic invoicing", "Email support"]
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    billingCycle: "month",
    maxProperties: 5,
    maxTenants: 100,
    maxStaff: 5,
    features: ["5 properties", "Up to 100 tenants", "5 staff members", "Advanced invoicing", "Utility billing", "Reports & analytics", "Priority support"],
    badge: "Most Popular",
    badgeColor: "bg-primary text-primary-foreground",
    recommended: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 79,
    billingCycle: "month",
    maxProperties: 999,
    maxTenants: 999,
    maxStaff: 999,
    features: ["Unlimited properties", "Unlimited tenants", "Unlimited staff", "Custom roles & permissions", "BullMQ background jobs", "Dedicated support", "API access"],
    badge: "Best Value",
    badgeColor: "bg-amber-500 text-black"
  }
];

const FEATURE_ICONS: Record<string, React.ElementType> = {
  "property": Building2,
  "tenant": Users,
  "staff": Users,
  "invoic": FileText,
  "report": FileText,
  "support": Headphones,
  "util": Zap,
  "role": Crown,
  "api": Zap,
  "bull": Zap
};

function getFeatureIcon(feature: string): React.ElementType {
  const key = Object.keys(FEATURE_ICONS).find(k => feature.toLowerCase().includes(k));
  return key ? FEATURE_ICONS[key] : CheckCircle2;
}

export default function SubscriptionsPage() {
  const [activePlan] = React.useState<string>("starter");
  const [billingAnnually, setBillingAnnually] = React.useState(false);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
          <Crown className="h-3.5 w-3.5" /> Subscription Plans
        </div>
        <h2 className="text-3xl font-black tracking-tight">Choose your plan</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Unlock more properties, tenants, and powerful features as your portfolio grows.
        </p>

        {/* Toggle billing */}
        <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full p-1.5 mt-2">
          <button
            onClick={() => setBillingAnnually(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${!billingAnnually ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingAnnually(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${billingAnnually ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            Annual <span className="ml-1 text-[10px] text-emerald-400 font-black">-20%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {PLANS.map(plan => {
          const isActive = plan.id === activePlan;
          const displayPrice = billingAnnually && plan.price > 0
            ? (plan.price * 0.8).toFixed(0)
            : plan.price;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 ${plan.recommended
                ? "border-primary shadow-xl shadow-primary/10 scale-105 ring-2 ring-primary/30"
                : "hover:shadow-lg hover:border-primary/30"
              } ${isActive ? "ring-2 ring-emerald-500/40 border-emerald-500/30" : ""}`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Current Plan
                  </Badge>
                </div>
              )}

              {/* Popular badge */}
              {plan.badge && !isActive && (
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <CardContent className="p-6 space-y-5">
                {/* Plan name */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className={`h-4 w-4 ${plan.recommended ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-black text-lg">{plan.name}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">${displayPrice}</span>
                    <span className="text-sm text-muted-foreground">/{billingAnnually ? "mo, billed yearly" : "month"}</span>
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { Icon: Building2, label: "Props", value: plan.maxProperties >= 999 ? "∞" : plan.maxProperties },
                    { Icon: Users, label: "Tenants", value: plan.maxTenants >= 999 ? "∞" : plan.maxTenants },
                    { Icon: Users, label: "Staff", value: plan.maxStaff >= 999 ? "∞" : plan.maxStaff }
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-accent/20 border border-border text-center">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="font-black text-sm">{value}</p>
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map(f => {
                    const Icon = getFeatureIcon(f);
                    return (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <div className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20">
                    Active Plan
                  </div>
                ) : (
                  <button className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${plan.recommended
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                    : "bg-card border border-border text-foreground hover:bg-accent/50"
                  }`}>
                    Upgrade to {plan.name} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage summary */}
      <Card className="mt-2">
        <CardContent className="p-6">
          <h3 className="font-bold text-sm mb-4">Current Usage — Starter Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Properties", used: 1, max: 1, color: "bg-amber-500" },
              { label: "Tenants", used: 8, max: 10, color: "bg-emerald-500" },
              { label: "Staff Members", used: 1, max: 1, color: "bg-amber-500" }
            ].map(u => {
              const pct = (u.used / u.max) * 100;
              return (
                <div key={u.label} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{u.label}</span>
                    <span className="text-muted-foreground">{u.used} / {u.max}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${u.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {pct >= 100 ? <span className="text-destructive font-bold">Limit reached — upgrade to add more</span> : `${u.max - u.used} remaining`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
