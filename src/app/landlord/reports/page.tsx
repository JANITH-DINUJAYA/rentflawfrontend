"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Building2,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Aggregated data states
  const [occupancy, setOccupancy] = useState<any>(null);
  const [overdueData, setOverdueData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [incomeMonths, setIncomeMonths] = useState<{ month: string; income: number }[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      // Build last 6 months list
      const last6: { month: number; year: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }

      const [occupancyRes, overdueRes, tenantsRes, propertiesRes, ...incomeResults] = await Promise.all([
        api.get("/reports/occupancy"),
        api.get("/reports/overdue"),
        api.get("/reports/tenants"),
        api.get("/properties"),
        ...last6.map(({ month, year }) => api.get(`/reports/income?month=${month}&year=${year}`))
      ]);

      setOccupancy(occupancyRes.data);
      setOverdueData(overdueRes.data);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);

      const months = last6.map((item, i) => ({
        month: MONTH_NAMES[item.month - 1],
        income: incomeResults[i]?.data?.totalIncome || 0
      }));
      setIncomeMonths(months);
    } catch {
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchAll} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const maxIncome = Math.max(...incomeMonths.map(d => d.income), 1);
  const totalIncome = incomeMonths.reduce((s, d) => s + d.income, 0);
  const totalOverdue = overdueData?.totalOverdue || 0;
  const overdueList = Array.isArray(overdueData?.overdueInvoices) ? overdueData.overdueInvoices : [];
  const occupancyPct = occupancy?.occupancyRate || 0;
  const totalTenants = tenants.length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Financial performance, occupancy status, and overdue summaries.</p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border border-border bg-card hover:bg-accent/50 text-foreground transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "6-Month Income", value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Active Tenants", value: String(totalTenants), icon: Users, color: "text-sky-500 bg-sky-500/10" },
          { label: "Overdue Balance", value: `$${Number(totalOverdue).toLocaleString()}`, icon: AlertCircle, color: "text-destructive bg-destructive/10" },
          { label: "Overall Occupancy", value: `${Math.round(occupancyPct)}%`, icon: Building2, color: "text-violet-500 bg-violet-500/10" }
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
            {incomeMonths.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No income data for the last 6 months.</p>
            ) : (
              incomeMonths.map(d => (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-8 text-right">{d.month}</span>
                  <div className="flex-1">
                    <MiniBar value={d.income} max={maxIncome} color="bg-primary" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Overdue Tenants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {overdueList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No overdue invoices. All caught up!</p>
            ) : (
              overdueList.map((inv: any) => {
                const tenantName = inv.agreement?.tenant
                  ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}`
                  : "Unknown Tenant";
                const daysPast = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
                return (
                  <div key={inv.id} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {tenantName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{tenantName}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.agreement?.property?.name || "—"}</p>
                      <p className="text-[10px] text-destructive font-semibold mt-0.5">{daysPast} days overdue</p>
                    </div>
                    <span className="text-sm font-black text-destructive whitespace-nowrap">${Number(inv.total_due).toFixed(0)}</span>
                  </div>
                );
              })
            )}
            {overdueList.length > 0 && (
              <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
                Total overdue: <span className="font-bold text-destructive">${Number(totalOverdue).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Breakdown from properties */}
      {properties.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Property Occupancy Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              {properties.map((p: any) => {
                const totalRooms = p._count?.rooms || p.rooms?.length || 0;
                const occupied = p._count?.agreements || 0;
                const pct = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;
                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold">{p.name}</p>
                      <div className="flex items-center gap-4 text-muted-foreground text-xs">
                        <span>{occupied}/{totalRooms} rooms</span>
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
      )}

      {/* Active Tenants table */}
      {tenants.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Active Tenants Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {tenants.slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                      {t.tenantName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-semibold">{t.tenantName}</p>
                      <p className="text-muted-foreground">{t.propertyName} · Rm {t.roomNumber}</p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">${Number(t.rentAmount).toFixed(0)}/mo</span>
                </div>
              ))}
              {tenants.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-2">+{tenants.length - 10} more tenants</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
