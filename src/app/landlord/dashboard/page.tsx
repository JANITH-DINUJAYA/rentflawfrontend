"use client";

import React, { useEffect, useState } from "react";
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
  FileText,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function LandlordDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupancyRate: 0,
    activeTenants: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
    overdueAmount: 0
  });

  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const [
          propertiesRes,
          occupancyRes,
          tenantsRes,
          paymentsRes,
          incomeRes,
          overdueRes,
          invoicesRes,
        ] = await Promise.all([
          api.get("/properties"),
          api.get("/reports/occupancy"),
          api.get("/tenants/my-tenants"),
          api.get("/payments/landlord?status=PENDING_REVIEW"),
          api.get(`/reports/income?month=${currentMonth}&year=${currentYear}`),
          api.get("/reports/overdue"),
          api.get("/invoices/landlord?limit=5"),
        ]);

        const totalProps = Array.isArray(propertiesRes.data) ? propertiesRes.data.length : 0;
        const occRate = Math.round(occupancyRes.data?.occupancyRate || 0);
        const activeT = Array.isArray(tenantsRes.data) ? tenantsRes.data.length : 0;
        const pendingApp = Array.isArray(paymentsRes.data?.submissions) ? paymentsRes.data.submissions.length : 0;
        const mRevenue = Number(incomeRes.data?.totalIncome || 0);
        const overdueD = Number(overdueRes.data?.totalOverdue || 0);

        setStats({
          totalProperties: totalProps,
          occupancyRate: occRate,
          activeTenants: activeT,
          pendingApprovals: pendingApp,
          monthlyRevenue: mRevenue,
          overdueAmount: overdueD
        });

        setPendingPayments(Array.isArray(paymentsRes.data?.submissions) ? paymentsRes.data.submissions.slice(0, 3) : []);
        setRecentInvoices(Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices.slice(0, 5) : []);
      } catch (err) {
        console.error("Failed to load landlord dashboard live KPIs", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200 cursor-pointer">
              <Plus className="mr-1.5 h-4 w-4" /> Add Property
            </button>
          </Link>
          <Link href="/landlord/agreements">
            <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200 cursor-pointer">
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
              <p className="text-xs text-muted-foreground">Registered asset locations</p>
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
              <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden mt-2">
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
              <h3 className="text-3xl font-extrabold">Rs {stats.monthlyRevenue.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">Total paid collections this month</p>
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
              <h3 className="text-3xl font-extrabold text-destructive">Rs {stats.overdueAmount.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground">Unpaid invoices past grace period</p>
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
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No pending payment submissions found.
                </div>
              ) : (
                pendingPayments.map((p) => {
                  const tenantName = p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : "Unknown Tenant";
                  const roomNumber = p.invoice?.agreement?.room?.room_number || "Room";
                  const propName = p.invoice?.agreement?.property?.name || "";
                  return (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {tenantName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{tenantName}</p>
                          <p className="text-xs text-muted-foreground">
                            {propName} - {roomNumber} • Submitted {new Date(p.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-bold text-foreground">Rs {Number(p.amount_paid).toFixed(2)}</span>
                        <Link href={`/landlord/payments`}>
                          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all duration-200 cursor-pointer">
                            Review Receipt
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
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
              {recentInvoices.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No invoices generated yet.
                </div>
              ) : (
                recentInvoices.map((inv) => {
                  const tenantName = inv.agreement?.tenant 
                    ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}`
                    : "Unknown Tenant";
                  return (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-bold flex items-center gap-1.5">
                          Inv #{inv.id.slice(0, 8)}... 
                          <span className="text-xs font-normal text-muted-foreground">({tenantName})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Due {new Date(inv.due_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold">Rs {Number(inv.amount).toFixed(2)}</span>
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
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
