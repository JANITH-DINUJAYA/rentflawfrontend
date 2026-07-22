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
  RefreshCw,
  Printer,
  Download,
  FileSpreadsheet,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ─── Mini bar chart ─────────────────────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-8 w-full rounded-lg bg-muted/40 relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full ${color} rounded-lg transition-all duration-700`} style={{ width: `${pct}%` }} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/70">
        Rs {value.toLocaleString()}
      </span>
    </div>
  );
}

/* ─── Export utilities ───────────────────── */
function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h] === null || r[h] === undefined ? "" : String(r[h]);
        return v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function printSection(title: string, html: string) {
  const w = window.open("", "_blank");
  if (!w) { alert("Popup blocked. Please allow popups."); return; }
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;padding:32px;margin:0}
          h1{font-size:20px;font-weight:900;color:#4f46e5;margin:0 0 4px}
          p.sub{color:#6b7280;font-size:12px;margin:0 0 24px}
          table{width:100%;border-collapse:collapse;font-size:13px}
          th{background:#f9fafb;color:#6b7280;font-weight:700;font-size:11px;text-transform:uppercase;padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:left}
          td{padding:10px 12px;border-bottom:1px solid #f3f4f6}
          .footer{font-size:11px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px}
          @media print{body{padding:16px}}
        </style>
      </head>
      <body>
        <h1>RentFlaw Platform — ${title}</h1>
        <p class="sub">Generated: ${new Date().toLocaleString()} · SaaS Admin Report</p>
        ${html}
        <p class="footer">RentFlaw — Global Rental Management SaaS</p>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close()},400)}<\/script>
      </body>
    </html>`);
  w.document.close();
}

function buildTableHTML(headers: string[], rows: (string | number)[]) {
  const ths = headers.map(h => `<th>${h}</th>`).join("");
  const trs = (rows as any[]).map((r: any[]) => `<tr>${r.map((c: any) => `<td>${c ?? "—"}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function ReportActions({ onPrint, onCSV }: { onPrint: () => void; onCSV: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onPrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors cursor-pointer">
        <Printer className="h-3.5 w-3.5" /> Print/PDF
      </button>
      <button onClick={onCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </button>
    </div>
  );
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [occupancy, setOccupancy] = useState<any>(null);
  const [overdueData, setOverdueData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [incomeMonths, setIncomeMonths] = useState<{ month: string; income: number }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const last6: { month: number; year: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }

      const [occupancyRes, overdueRes, tenantsRes, ...incomeResults] = await Promise.all([
        api.get("/reports/occupancy"),
        api.get("/reports/overdue"),
        api.get("/reports/tenants"),
        ...last6.map(({ month, year }) => api.get(`/reports/income?month=${month}&year=${year}`))
      ]);

      setOccupancy(occupancyRes.data);
      setOverdueData(overdueRes.data);
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      const months = last6.map((item, i) => ({
        month: MONTH_NAMES[item.month - 1],
        income: incomeResults[i]?.data?.totalIncome || 0
      }));
      setIncomeMonths(months);
    } catch {
      setError("Failed to load platform reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </DashboardLayout>
  );

  if (error) return (
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

  const maxIncome = Math.max(...incomeMonths.map(d => d.income), 1);
  const totalIncome = incomeMonths.reduce((s, d) => s + d.income, 0);
  const totalOverdue = overdueData?.totalOverdue || 0;
  const overdueList = Array.isArray(overdueData?.overdueInvoices) ? overdueData.overdueInvoices : [];
  const occupancyPct = occupancy?.occupancyRate || 0;

  /* Export handlers */
  const printIncome = () => {
    const html = buildTableHTML(["Month", "Income"], incomeMonths.map(d => [d.month, `Rs ${d.income.toLocaleString()}`]) as any);
    printSection("Platform Income Trend (Last 6 Months)", html);
  };
  const csvIncome = () => exportCSV(incomeMonths.map(d => ({ Month: d.month, Income: d.income })), "platform_income_report");

  const printOverdue = () => {
    const html = buildTableHTML(
      ["Tenant", "Property", "Days Overdue", "Amount Due"],
      overdueList.map((inv: any) => {
        const name = inv.agreement?.tenant ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}` : "—";
        const days = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000);
        return [name, inv.agreement?.property?.name || "—", `${days} days`, `Rs ${Number(inv.total_due).toFixed(2)}`];
      }) as any
    );
    printSection("Platform Overdue Invoices Report", html);
  };
  const csvOverdue = () => exportCSV(
    overdueList.map((inv: any) => ({
      Tenant: inv.agreement?.tenant ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}` : "—",
      Property: inv.agreement?.property?.name || "—",
      Due_Date: new Date(inv.due_date).toLocaleDateString(),
      Days_Overdue: Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000),
      Amount_Due: Number(inv.total_due).toFixed(2),
    })),
    "platform_overdue_report"
  );

  const printTenants = () => {
    const html = buildTableHTML(
      ["Tenant", "Email", "Property", "Room", "Monthly Rent"],
      tenants.map(t => [t.tenantName, t.email, t.propertyName, t.roomNumber, `Rs ${Number(t.rentAmount).toFixed(0)}`]) as any
    );
    printSection("Platform Active Tenants Report", html);
  };
  const csvTenants = () => exportCSV(
    tenants.map(t => ({ Name: t.tenantName, Email: t.email, Phone: t.phone, Property: t.propertyName, Room: t.roomNumber, Monthly_Rent: Number(t.rentAmount).toFixed(2) })),
    "platform_tenants_report"
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Platform Reports</h2>
          </div>
          <p className="text-sm text-muted-foreground">Global platform-wide analytics across all landlords and tenants.</p>
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
          { label: "Platform 6M Income", value: `Rs ${totalIncome.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Active Tenants", value: String(tenants.length), icon: Users, color: "text-sky-500 bg-sky-500/10" },
          { label: "Overdue Balance", value: `Rs ${Number(totalOverdue).toLocaleString()}`, icon: AlertCircle, color: "text-destructive bg-destructive/10" },
          { label: "Overall Occupancy", value: `${Math.round(occupancyPct)}%`, icon: Building2, color: "text-violet-500 bg-violet-500/10" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${kpi.color}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Income + Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Platform Income Trend
            </CardTitle>
            <ReportActions onPrint={printIncome} onCSV={csvIncome} />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {incomeMonths.map(d => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-8 text-right">{d.month}</span>
                <div className="flex-1"><MiniBar value={d.income} max={maxIncome} color="bg-primary" /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Overdue Invoices
            </CardTitle>
            <ReportActions onPrint={printOverdue} onCSV={csvOverdue} />
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {overdueList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No overdue invoices platform-wide!</p>
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
                    <span className="text-sm font-black text-destructive whitespace-nowrap">Rs {Number(inv.total_due).toFixed(0)}</span>
                  </div>
                );
              })
            )}
            {overdueList.length > 0 && (
              <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
                Total overdue: <span className="font-bold text-destructive">Rs {Number(totalOverdue).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Tenants Table */}
      {tenants.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Active Tenants Platform Summary
            </CardTitle>
            <ReportActions onPrint={printTenants} onCSV={csvTenants} />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {tenants.slice(0, 15).map((t: any, i: number) => (
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
                  <span className="font-bold text-foreground">Rs {Number(t.rentAmount).toFixed(0)}/mo</span>
                </div>
              ))}
              {tenants.length > 15 && (
                <p className="text-xs text-center text-muted-foreground pt-2">+{tenants.length - 15} more tenants — export for full list</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
