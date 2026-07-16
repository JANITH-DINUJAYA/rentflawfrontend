"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Building2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ─── Tiny bar chart rendered via CSS ──────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-8 w-full rounded-lg bg-muted/40 relative overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full ${color} rounded-lg transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/70">
        ${value.toLocaleString()}
      </span>
    </div>
  );
}

const INCOME_DATA = [
  { month: "Feb", income: 3200 },
  { month: "Mar", income: 4800 },
  { month: "Apr", income: 4500 },
  { month: "May", income: 5200 },
  { month: "Jun", income: 4900 },
  { month: "Jul", income: 5600 }
];

const OVERDUE_TENANTS = [
  { name: "John Smith", property: "Greenwood Residence", room: "101", amount: 450, daysPast: 12 },
  { name: "Ray Morales", property: "City Center Hostels", room: "310", amount: 600, daysPast: 7 },
  { name: "Nina Reyes", property: "Greenwood Residence", room: "204", amount: 550, daysPast: 3 }
];

const PROPERTY_STATS = [
  { name: "Greenwood Residence", total: 24, occupied: 20, revenue: 9000 },
  { name: "City Center Hostels", total: 30, occupied: 22, revenue: 13200 },
  { name: "Bay Avenue Suites", total: 10, occupied: 6, revenue: 4200 }
];

export default function ReportsPage() {
  const maxIncome = Math.max(...INCOME_DATA.map(d => d.income));
  const totalIncome = INCOME_DATA.reduce((s, d) => s + d.income, 0);
  const totalOverdue = OVERDUE_TENANTS.reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Financial performance, occupancy status, and overdue summaries.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border border-border bg-card hover:bg-accent/50 text-foreground transition-all duration-200 active:scale-95">
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "6-Month Income", value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Total Tenants", value: "48", icon: Users, color: "text-sky-500 bg-sky-500/10" },
          { label: "Overdue Balance", value: `$${totalOverdue.toLocaleString()}`, icon: AlertCircle, color: "text-destructive bg-destructive/10" },
          { label: "Overall Occupancy", value: "74%", icon: Building2, color: "text-violet-500 bg-violet-500/10" }
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main grid: Income chart + Overdue list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Monthly Income Trend
            </CardTitle>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {INCOME_DATA.map(d => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-8 text-right">{d.month}</span>
                <div className="flex-1">
                  <MiniBar value={d.income} max={maxIncome} color="bg-primary" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue Tenants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Overdue Tenants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {OVERDUE_TENANTS.map(t => (
              <div key={t.name} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.property} · Rm {t.room}</p>
                  <p className="text-[10px] text-destructive font-semibold mt-0.5">{t.daysPast} days overdue</p>
                </div>
                <span className="text-sm font-black text-destructive whitespace-nowrap">${t.amount}</span>
              </div>
            ))}
            <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
              Total overdue: <span className="font-bold text-destructive">${totalOverdue}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Property Occupancy Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-5">
            {PROPERTY_STATS.map(p => {
              const pct = Math.round((p.occupied / p.total) * 100);
              return (
                <div key={p.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold">{p.name}</p>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>{p.occupied}/{p.total} rooms</span>
                      <span className="font-bold text-foreground">${p.revenue.toLocaleString()}/mo</span>
                      <span className={`font-black ${pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-destructive"}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-destructive"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
