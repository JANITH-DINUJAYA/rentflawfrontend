"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Crown, Activity, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [landlords, setLandlords] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [llRes, tRes, pkgRes] = await Promise.all([
          api.get("/landlords"),
          api.get("/tenants"),
          api.get("/subscriptions/packages"),
        ]);
        setLandlords(Array.isArray(llRes.data) ? llRes.data : []);
        setTenants(Array.isArray(tRes.data) ? tRes.data : []);
        setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
      } catch (err) {
        console.error("Admin dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeLandlords = landlords.filter((l: any) => l.user?.is_active !== false);
  const recentLandlords = [...landlords]
    .sort((a, b) => new Date(b.user?.created_at || 0).getTime() - new Date(a.user?.created_at || 0).getTime())
    .slice(0, 5);

  // Revenue estimate: count active subscriptions × average package price
  const activeSubsCount = landlords.filter((l: any) => l.subscription_status === "ACTIVE").length;
  const avgPkg = packages.length > 0
    ? packages.reduce((sum: number, p: any) => sum + Number(p.price_monthly || 0), 0) / packages.length
    : 0;
  const mrrEstimate = (activeSubsCount * avgPkg).toFixed(0);

  const kpis = [
    {
      label: "Active Landlords",
      value: loading ? "—" : String(activeLandlords.length),
      sub: loading ? "" : `${landlords.length} total registered`,
      icon: Building2,
      color: "text-violet-400 bg-violet-500/15",
      href: "/admin/landlords",
    },
    {
      label: "Total Tenants",
      value: loading ? "—" : String(tenants.length),
      sub: loading ? "" : "Global tenant accounts",
      icon: Users,
      color: "text-sky-400 bg-sky-500/15",
      href: "/admin/tenants",
    },
    {
      label: "Active Subscriptions",
      value: loading ? "—" : String(activeSubsCount),
      sub: loading ? "" : `Est. MRR: Rs ${mrrEstimate}`,
      icon: Crown,
      color: "text-amber-400 bg-amber-500/15",
      href: "/admin/subscriptions",
    },
    {
      label: "Subscription Packages",
      value: loading ? "—" : String(packages.length),
      sub: loading ? "" : "Available pricing tiers",
      icon: Activity,
      color: "text-emerald-400 bg-emerald-500/15",
      href: "/admin/subscriptions",
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Control Panel</h2>
        <p className="text-sm text-muted-foreground">
          Monitor platform landlords, tenants, subscriptions and system resources.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-sm flex-shrink-0 ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                    ) : (
                      <p className="text-2xl font-black">{kpi.value}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Landlord Signups */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Recent Landlord Signups
            </CardTitle>
            <Link href="/admin/landlords" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : recentLandlords.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No landlords registered yet.</p>
            ) : (
              recentLandlords.map((ll: any) => (
                <div key={ll.id} className="flex items-center justify-between p-3 rounded-sm border border-border bg-card hover:bg-accent/25 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {(ll.company_name || ll.user?.first_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold">
                        {ll.company_name || `${ll.user?.first_name} ${ll.user?.last_name}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ll.user?.email} · {ll.user?.created_at ? new Date(ll.user.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`font-bold text-[9px] border-none uppercase ${
                        ll.subscription_status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {ll.subscription_status || "NO PLAN"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Tenants */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Recent Tenants
            </CardTitle>
            <Link href="/admin/tenants" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : tenants.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No tenants registered yet.</p>
            ) : (
              [...tenants]
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                .slice(0, 5)
                .map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-sm border border-border hover:bg-accent/20 transition-all">
                    <div className="h-8 w-8 rounded-sm bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {(t.first_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{t.first_name} {t.last_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.tenant_code || t.email}</p>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
