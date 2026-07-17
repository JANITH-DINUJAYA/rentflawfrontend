"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  Building2,
  BedDouble,
  UploadCloud,
  Loader2,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import Link from "next/link";

const STATUS_META = {
  PAID: { label: "Paid", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  PENDING: { label: "Due", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Overdue", color: "text-destructive bg-destructive/10", icon: AlertCircle }
};

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, invoicesRes] = await Promise.all([
          api.get("/tenants/profile"),
          api.get("/invoices/tenant"),
        ]);
        setProfile(profileRes.data);
        setInvoices(Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : []);
      } catch (err) {
        console.error("Failed to load tenant dashboard live data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  // Find active agreement
  const activeAgreement = profile?.rental_agreements?.find((a: any) => a.status === "ACTIVE");
  const pendingAgreement = profile?.rental_agreements?.find((a: any) => a.status === "DRAFT");
  const propertyName = activeAgreement?.property?.name || "No Active Lease";
  const roomNumber = activeAgreement?.room?.room_number || "—";

  // Filter invoices for outstanding ones
  const outstandingInvoices = invoices.filter(inv => inv.status === "PENDING" || inv.status === "OVERDUE");
  // Sort by due date asc to find the nearest/oldest outstanding one
  const currentInvoice = outstandingInvoices.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const creditBalance = profile?.credit_amount || 0;
  const nextDue = currentInvoice ? new Date(currentInvoice.due_date).toLocaleDateString() : "—";
  const daysLeft = currentInvoice
    ? Math.max(0, Math.ceil((new Date(currentInvoice.due_date).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <DashboardLayout>
      {/* Lease invitation banner */}
      {pendingAgreement && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Lease invitation pending
            </p>
            <h4 className="font-extrabold text-sm text-foreground">
              You are invited to join {pendingAgreement.property.name} — Room {pendingAgreement.room.room_number}
            </h4>
            <p className="text-xs text-muted-foreground">
              Rent: ${Number(pendingAgreement.rent_amount).toFixed(2)}/mo · Security Deposit: ${Number(pendingAgreement.security_deposit).toFixed(2)}
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await api.patch(`/agreements/${pendingAgreement.id}/accept-invitation`);
                const [profileRes, invoicesRes] = await Promise.all([
                  api.get("/tenants/profile"),
                  api.get("/invoices/tenant"),
                ]);
                setProfile(profileRes.data);
                setInvoices(Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : []);
              } catch (err) {
                alert("Failed to accept lease invitation.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-1"
          >
            <Check className="h-3.5 w-3.5" /> Accept Invitation
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-white shadow-xl shadow-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/70 mb-0.5">Welcome back 👋</p>
            <h2 className="text-3xl font-black">{profile?.first_name} {profile?.last_name}</h2>
            <p className="text-sm text-white/80 mt-1">Tenant code: <span className="font-bold font-mono bg-white/10 px-2 py-0.5 rounded-sm">{profile?.tenant_code || "—"}</span></p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
              <Building2 className="h-4 w-4" />
              <p className="text-sm font-bold">{propertyName}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20">
              <BedDouble className="h-4 w-4" />
              <p className="text-sm font-bold">Room {roomNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Current Invoice",
            value: currentInvoice ? `$${Number(currentInvoice.total_due).toFixed(2)}` : "Clear",
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
            value: `$${Number(creditBalance).toFixed(2)}`,
            sub: "Overpayment credit",
            icon: CheckCircle2,
            color: "text-emerald-500 bg-emerald-500/10"
          },
          {
            label: "Invoices",
            value: `${invoices.length}`,
            sub: `${invoices.filter(i => i.status === "PAID").length} paid`,
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
                  <Badge variant="outline" className={`${STATUS_META[currentInvoice.status as keyof typeof STATUS_META].color} border-none font-bold`}>
                    {React.createElement(STATUS_META[currentInvoice.status as keyof typeof STATUS_META].icon, { className: "h-3.5 w-3.5 mr-1" })}
                    {STATUS_META[currentInvoice.status as keyof typeof STATUS_META].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Inv #{currentInvoice.id.slice(0, 8)}...</span>
                </div>
                <p className="font-bold text-xl">{currentInvoice.type} Invoice</p>
                <p className="text-3xl font-black">${Number(currentInvoice.total_due).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Due: {new Date(currentInvoice.due_date).toLocaleDateString()}</p>
              </div>
              <Link
                href="/tenant/payments/submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" /> Submit Payment Receipt
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold">All Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No invoices found in your account history.
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/20 transition-all duration-150">
                  <div>
                    <p className="font-bold text-sm">
                      {inv.type} Invoice <span className="text-xs font-normal text-muted-foreground font-mono">(#{inv.id.slice(0, 8)})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due Date: {new Date(inv.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm">${Number(inv.total_due).toFixed(2)}</span>
                    <Badge variant="outline" className={`${STATUS_META[inv.status as keyof typeof STATUS_META].color} border-none font-bold`}>
                      {React.createElement(STATUS_META[inv.status as keyof typeof STATUS_META].icon, { className: "h-3.5 w-3.5 mr-1" })}
                      {STATUS_META[inv.status as keyof typeof STATUS_META].label}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
