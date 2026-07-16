"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Building2, Users, ArrowRight, Settings, CheckCircle2 } from "lucide-react";

interface SaaSPlan {
  id: string;
  name: string;
  price: number;
  maxProperties: number;
  maxTenants: number;
  maxStaff: number;
  features: string[];
}

const INITIAL_PLANS: SaaSPlan[] = [
  { id: "starter", name: "Starter", price: 0, maxProperties: 1, maxTenants: 10, maxStaff: 1, features: ["1 property", "Up to 10 tenants", "1 staff member", "Basic invoicing", "Email support"] },
  { id: "pro", name: "Pro", price: 29, maxProperties: 5, maxTenants: 100, maxStaff: 5, features: ["5 properties", "Up to 100 tenants", "5 staff members", "Advanced invoicing", "Utility billing", "Reports & analytics", "Priority support"] },
  { id: "enterprise", name: "Enterprise", price: 79, maxProperties: 999, maxTenants: 999, maxStaff: 999, features: ["Unlimited properties", "Unlimited tenants", "Unlimited staff", "Custom roles & permissions", "BullMQ background jobs", "Dedicated support", "API access"] }
];

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = React.useState<SaaSPlan[]>(INITIAL_PLANS);
  const [editingPlan, setEditingPlan] = React.useState<SaaSPlan | null>(null);

  // Edit Form State
  const [form, setForm] = React.useState({
    price: "",
    maxProperties: "",
    maxTenants: "",
    maxStaff: ""
  });

  const handleSave = () => {
    if (!editingPlan) return;
    setPlans(plans.map(p => 
      p.id === editingPlan.id
        ? {
            ...p,
            price: parseFloat(form.price) || 0,
            maxProperties: parseInt(form.maxProperties) || 0,
            maxTenants: parseInt(form.maxTenants) || 0,
            maxStaff: parseInt(form.maxStaff) || 0
          }
        : p
    ));
    setEditingPlan(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SaaS Subscription Packages</h2>
        <p className="text-sm text-muted-foreground">Adjust limits, features, and billing rates for all rental platform subscription levels.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="relative overflow-hidden border border-border bg-card">
            <CardContent className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-primary" />
                  <p className="font-black text-lg">{plan.name}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              {/* Limit badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { Icon: Building2, label: "Props Limit", value: plan.maxProperties >= 999 ? "∞" : plan.maxProperties },
                  { Icon: Users, label: "Tenants Limit", value: plan.maxTenants >= 999 ? "∞" : plan.maxTenants },
                  { Icon: Users, label: "Staff Limit", value: plan.maxStaff >= 999 ? "∞" : plan.maxStaff }
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-accent/20 border border-border text-center">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-black text-sm">{value}</p>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Features list */}
              <ul className="space-y-2 border-t border-border pt-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Edit button */}
              <button
                onClick={() => {
                  setEditingPlan(plan);
                  setForm({
                    price: plan.price.toString(),
                    maxProperties: plan.maxProperties.toString(),
                    maxTenants: plan.maxTenants.toString(),
                    maxStaff: plan.maxStaff.toString()
                  });
                }}
                className="w-full py-2 text-xs font-bold rounded-xl bg-card border border-border text-foreground hover:bg-accent/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" /> Adjust Limits & Price
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Adjust Limits Dialog */}
      <Dialog open={editingPlan !== null} onOpenChange={open => !open && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Configure Pricing Plan</DialogTitle>
            <DialogDescription>Alter subscription parameters. Changes will apply immediately to landlords on this plan.</DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="planPrice">Monthly Subscription Price ($)</Label>
                <Input
                  id="planPrice"
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="maxProps">Max Properties</Label>
                  <Input
                    id="maxProps"
                    type="number"
                    value={form.maxProperties}
                    onChange={e => setForm({ ...form, maxProperties: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxTenants">Max Tenants</Label>
                  <Input
                    id="maxTenants"
                    type="number"
                    value={form.maxTenants}
                    onChange={e => setForm({ ...form, maxTenants: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxStaff">Max Staff</Label>
                  <Input
                    id="maxStaff"
                    type="number"
                    value={form.maxStaff}
                    onChange={e => setForm({ ...form, maxStaff: e.target.value })}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Apply Parameters
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
