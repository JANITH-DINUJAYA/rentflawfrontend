"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Crown, Activity, AlertCircle, ArrowUpRight } from "lucide-react";

interface LandlordActivity {
  id: string;
  name: string;
  email: string;
  subscription: string;
  propertiesCount: number;
  registeredAt: string;
}

const RECENT_LANDLORDS: LandlordActivity[] = [
  { id: "LL-004", name: "Apex Properties Ltd", email: "billing@apexprop.com", subscription: "PRO", propertiesCount: 4, registeredAt: "2026-07-15" },
  { id: "LL-003", name: "Greenwood Rentals", email: "info@greenwoodrent.com", subscription: "ENTERPRISE", propertiesCount: 8, registeredAt: "2026-07-14" },
  { id: "LL-002", name: "John Doe (Individual)", email: "john.doe@gmail.com", subscription: "STARTER", propertiesCount: 1, registeredAt: "2026-07-10" }
];

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin System Control Panel</h2>
        <p className="text-sm text-muted-foreground">Monitor platform tenants, track MRR subscriptions growth, and manage global system resources.</p>
      </div>

      {/* Global SaaS Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Landlords", value: "24", sub: "+3 this week", icon: Building2, color: "text-primary bg-primary/10" },
          { label: "Total Tenants Registered", value: "312", sub: "+18 this week", icon: Users, color: "text-sky-500 bg-sky-500/10" },
          { label: "Monthly Recurring Revenue", value: "$1,840", sub: "MRR Growth +12%", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "System Health", value: "99.98%", sub: "All services operational", icon: Activity, color: "text-violet-500 bg-violet-500/10" }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Recent Landlord Signups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {RECENT_LANDLORDS.map(ll => (
              <div key={ll.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-accent/25 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {ll.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{ll.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ll.email} · {ll.registeredAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold text-[9px] border-none bg-primary/10 text-primary uppercase">
                    {ll.subscription}
                  </Badge>
                  <p className="text-xs font-bold text-muted-foreground">{ll.propertiesCount} properties</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Global Security / Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" /> System Alerts & Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            {[
              { title: "Resend Email Queue", desc: "No delays detected. Delivery rate: 99.8%", status: "OPERATIONAL" },
              { title: "BullMQ Scheduler", desc: "Overdue scan complete. Next cycle in 12 hours.", status: "IDLE" },
              { title: "Cloudflare R2 Bucket", desc: "Receipt storage upload health: Excellent.", status: "OPERATIONAL" }
            ].map((alert, i) => (
              <div key={i} className="p-3 rounded-xl border border-border bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{alert.title}</p>
                  <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{alert.status}</span>
                </div>
                <p className="text-muted-foreground text-[10px]">{alert.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
