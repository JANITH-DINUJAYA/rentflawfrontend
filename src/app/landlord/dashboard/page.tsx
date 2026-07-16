"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Building, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Plus,
  FileText
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandlordDashboard() {
  // Mock statistics data for the dashboard presentation
  const stats = {
    totalProperties: 12,
    occupancyRate: 83, // 83% occupied
    activeTenants: 45,
    pendingApprovals: 3,
    monthlyRevenue: 18450.00,
    overdueAmount: 1250.00
  };

  const pendingPayments = [
    { id: "1", tenant: "Alice Vance", room: "Room 102", amount: 450, date: "2026-07-14", status: "PENDING_REVIEW" },
    { id: "2", tenant: "Marcus Brody", room: "Room 205", amount: 600, date: "2026-07-15", status: "PENDING_REVIEW" },
    { id: "3", tenant: "Clara Oswald", room: "Room 108", amount: 350, date: "2026-07-16", status: "PENDING_REVIEW" }
  ];

  const recentInvoices = [
    { id: "1004", tenant: "John Smith", amount: 550, due: "2026-07-20", status: "PAID" },
    { id: "1003", tenant: "Jane Doe", amount: 450, due: "2026-07-18", status: "PENDING" },
    { id: "1002", tenant: "Bob Johnson", amount: 650, due: "2026-07-10", status: "OVERDUE" },
    { id: "1001", tenant: "Emily Davis", amount: 400, due: "2026-07-05", status: "PAID" }
  ];

  return (
    <DashboardLayout>
      {/* ─── Page Title / Actions Header ─────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-muted-foreground">Manage your properties, billing, and tenant relations in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/landlord/properties">
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200">
              <Plus className="mr-1.5 h-4 w-4" /> Add Property
            </button>
          </Link>
          <Link href="/landlord/agreements">
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200">
              <FileText className="mr-1.5 h-4 w-4" /> Draft Lease
            </button>
          </Link>
        </div>
      </div>

      {/* ─── KPI Metric Cards ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Properties</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Building className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold">{stats.totalProperties}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-emerald-500 font-semibold flex items-center">
                  +2 new <ArrowUpRight className="h-3 w-3" />
                </span>
                this month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupancy</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold">{stats.occupancyRate}%</h3>
              <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Revenue</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold">${stats.monthlyRevenue.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-emerald-500 font-semibold flex items-center">
                  +12.4% <ArrowUpRight className="h-3 w-3" />
                </span>
                from last month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overdue Dues</span>
              <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold text-destructive">${stats.overdueAmount.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground">3 invoices past grace period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Main Grid Layout ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Payments for Review */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payment Approvals</CardTitle>
              <CardDescription>Verify uploaded manual transaction receipts to settle invoices.</CardDescription>
            </div>
            {stats.pendingApprovals > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {stats.pendingApprovals} pending
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {p.tenant[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.tenant}</p>
                      <p className="text-xs text-muted-foreground">{p.room} • Submitted {p.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold text-foreground">${p.amount}</span>
                    <Link href={`/landlord/payments`}>
                      <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all duration-200">
                        Review Receipt
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Recent Invoices & Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Overview of lately generated invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold flex items-center gap-1.5">
                      Inv #{inv.id} 
                      <span className="text-xs font-normal text-muted-foreground">({inv.tenant})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Due {inv.due}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold">${inv.amount}</span>
                    {inv.status === "PAID" ? (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-none">
                        <CheckCircle className="mr-1 h-3 w-3" /> Paid
                      </Badge>
                    ) : inv.status === "OVERDUE" ? (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none">
                        <Clock className="mr-1 h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
