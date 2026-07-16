"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Building2,
  BedDouble,
  UploadCloud,
  LifeBuoy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TenantInvoice {
  id: string;
  month: string;
  amount: number;
  status: "PAID" | "OVERDUE" | "PENDING";
  dueDate: string;
}

const MY_INVOICES: TenantInvoice[] = [
  { id: "INV-005", month: "July 2026", amount: 450, status: "PENDING", dueDate: "2026-07-20" },
  { id: "INV-004", month: "June 2026", amount: 450, status: "PAID", dueDate: "2026-06-20" },
  { id: "INV-003", month: "May 2026", amount: 450, status: "PAID", dueDate: "2026-05-20" },
  { id: "INV-002", month: "April 2026", amount: 480, status: "OVERDUE", dueDate: "2026-04-20" }
];

const STATUS_META = {
  PAID: { label: "Paid", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  PENDING: { label: "Due", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Overdue", color: "text-destructive bg-destructive/10", icon: AlertCircle }
};

export default function TenantDashboard() {
  const currentInvoice = MY_INVOICES.find(inv => inv.status === "PENDING" || inv.status === "OVERDUE");
  const creditBalance = 0;
  const nextDue = currentInvoice?.dueDate ?? "—";
  const daysLeft = currentInvoice
    ? Math.max(0, Math.ceil((new Date(currentInvoice.dueDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-white shadow-xl shadow-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/70 mb-0.5">Welcome back 👋</p>
            <h2 className="text-3xl font-black">Alice Vance</h2>
            <p className="text-sm text-white/80 mt-1">Tenant code: <span className="font-bold font-mono">T-AVA-001</span></p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
              <Building2 className="h-4 w-4" />
              <p className="text-sm font-bold">Greenwood Residence</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
              <BedDouble className="h-4 w-4" />
              <p className="text-sm font-bold">Room 102 · Floor 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Current Invoice",
            value: currentInvoice ? `$${currentInvoice.amount}` : "Clear",
            sub: currentInvoice ? `Due ${nextDue}` : "No outstanding bills",
            icon: DollarSign,
            color: currentInvoice?.status === "OVERDUE" ? "text-destructive bg-destructive/10" : "text-amber-500 bg-amber-500/10"
          },
          {
            label: "Days Until Due",
            value: currentInvoice ? `${daysLeft}d` : "—",
            sub: "For current period",
            icon: CalendarDays,
            color: daysLeft <= 3 && currentInvoice ? "text-destructive bg-destructive/10" : "text-sky-500 bg-sky-500/10"
          },
          {
            label: "Credit Balance",
            value: `$${creditBalance}`,
            sub: "Overpayment credit",
            icon: CheckCircle2,
            color: "text-emerald-500 bg-emerald-500/10"
          },
          {
            label: "Invoices",
            value: `${MY_INVOICES.length}`,
            sub: `${MY_INVOICES.filter(i => i.status === "PAID").length} paid`,
            icon: FileText,
            color: "text-violet-500 bg-violet-500/10"
          }
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current invoice action */}
      {currentInvoice && (
        <Card className={`border-2 ${currentInvoice.status === "OVERDUE" ? "border-destructive/30 shadow-destructive/5" : "border-primary/20"} shadow-lg`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${STATUS_META[currentInvoice.status].color} border-none font-bold`}>
                    {React.createElement(STATUS_META[currentInvoice.status].icon, { className: "h-3.5 w-3.5 mr-1" })}
                    {STATUS_META[currentInvoice.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{currentInvoice.id}</span>
                </div>
                <p className="font-bold text-xl">{currentInvoice.month} Invoice</p>
                <p className="text-3xl font-black">${currentInvoice.amount}</p>
                <p className="text-xs text-muted-foreground">Due: {currentInvoice.dueDate}</p>
              </div>
              <a
                href="/tenant/payments/submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                <UploadCloud className="h-4 w-4" /> Submit Payment Receipt
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {MY_INVOICES.slice(0, 4).map(inv => {
              const meta = STATUS_META[inv.status];
              const Icon = meta.icon;
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/20 transition-colors group cursor-pointer">
                  <div className={`p-2 rounded-lg ${meta.color} flex-shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{inv.month}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.id} · Due {inv.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">${inv.amount}</p>
                    <p className={`text-[10px] font-bold ${meta.color.split(" ")[0]}`}>{meta.label}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[
              { href: "/tenant/payments/submit", icon: UploadCloud, label: "Submit Payment Receipt", sub: "Upload proof of payment", color: "bg-primary/10 text-primary" },
              { href: "/tenant/invoices", icon: FileText, label: "View All Invoices", sub: "See full invoice history", color: "bg-sky-500/10 text-sky-500" },
              { href: "/tenant/support", icon: LifeBuoy, label: "Raise Support Ticket", sub: "Report maintenance or issues", color: "bg-amber-500/10 text-amber-500" },
              { href: "/tenant/agreement", icon: Building2, label: "My Agreement", sub: "View lease details", color: "bg-violet-500/10 text-violet-500" }
            ].map(action => {
              const Icon = action.icon;
              return (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/20 hover:border-primary/20 hover:shadow-md transition-all duration-200 group"
                >
                  <div className={`p-3 rounded-xl ${action.color} flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.sub}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
