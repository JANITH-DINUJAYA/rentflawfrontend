"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Crown, Check, Loader2, AlertCircle, ArrowRight, Star, Building2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface Package {
  id: string;
  name: string;
  price: number;
  max_properties: number;
  max_tenants: number;
  max_staff: number;
}

interface MySubscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  package: Package;
}

const ICONS = [Star, Crown, Building2];
const BG = ["bg-blue-500/10", "bg-yellow-500/10", "bg-purple-500/10"];
const TEXT = ["text-blue-500", "text-yellow-500", "text-purple-500"];

export default function LandlordSubscriptionsPage() {
  const [mySubscription, setMySubscription] = useState<MySubscription | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [upgradeTarget, setUpgradeTarget] = useState<Package | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // Cancel subscription states
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subRes, pkgRes] = await Promise.all([
        api.get("/subscriptions/my-subscription").catch(() => ({ data: null })),
        api.get("/subscriptions/packages"),
      ]);
      setMySubscription(subRes.data);
      setPackages(pkgRes.data);
    } catch {
      setError("Failed to load subscription information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    setUpgrading(true);
    setUpgradeError("");
    try {
      // Free plan — upgrade directly without payment
      if (upgradeTarget.price === 0) {
        await api.post("/subscriptions/upgrade", { packageId: upgradeTarget.id });
        setUpgradeTarget(null);
        await fetchData();
        return;
      }

      // Paid plan — initiate PayHere checkout
      const res = await api.post("/payments/payhere/initiate-subscription", {
        packageId: upgradeTarget.id,
      });
      const payhereParams = res.data;

      // Submit form via POST redirect to PayHere sandbox
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payhere.lk/pay/checkout";
      Object.keys(payhereParams).forEach(key => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(payhereParams[key]);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setUpgradeError(Array.isArray(msg) ? msg[0] : msg || "Failed to initiate subscription checkout.");
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await api.post("/subscriptions/cancel");
      setCancelOpen(false);
      await fetchData();
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscription & Billing</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your SaaS plan and upgrade or cancel when needed.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Plan */}
          {mySubscription && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Current Plan</p>
                    <CardTitle className="text-2xl font-extrabold mt-1">{mySubscription.package.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-xs">{mySubscription.status}</Badge>
                    <button
                      onClick={() => setCancelOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-bold cursor-pointer"
                      title="Cancel subscription"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Cancel Subscription
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center bg-background rounded-xl p-3">
                  {[
                    { label: "Properties", val: mySubscription.package.max_properties >= 999 ? "∞" : mySubscription.package.max_properties },
                    { label: "Tenants", val: mySubscription.package.max_tenants >= 999 ? "∞" : mySubscription.package.max_tenants },
                    { label: "Staff", val: mySubscription.package.max_staff >= 999 ? "∞" : mySubscription.package.max_staff },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                      <p className="text-xl font-extrabold">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Started: {new Date(mySubscription.start_date).toLocaleDateString()}</span>
                  <span>Renews: {new Date(mySubscription.end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {!mySubscription && (
            <div className="p-6 rounded-xl border-2 border-dashed border-border text-center space-y-2">
              <Crown className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-semibold">No active subscription</p>
              <p className="text-sm text-muted-foreground">Choose a plan below to activate your account.</p>
            </div>
          )}

          {/* Available Plans */}
          <div>
            <h3 className="text-lg font-bold mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {packages.map((pkg, i) => {
                const Icon = ICONS[i % ICONS.length];
                const isCurrentPlan = mySubscription?.package.id === pkg.id;
                return (
                  <Card key={pkg.id} className={`relative overflow-hidden transition-all ${isCurrentPlan ? "border-primary ring-1 ring-primary/30" : "hover:shadow-lg"}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    <CardHeader className="pb-3">
                      <div className={`h-11 w-11 rounded-xl ${BG[i % BG.length]} ${TEXT[i % TEXT.length]} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-extrabold mt-3">{pkg.name}</CardTitle>
                      <p className="text-2xl font-black">
                        {pkg.price === 0 ? "Free" : `$${pkg.price}`}
                        {pkg.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-1.5">
                        {[
                          `${pkg.max_properties >= 999 ? "Unlimited" : `Up to ${pkg.max_properties}`} properties`,
                          `${pkg.max_tenants >= 999 ? "Unlimited" : `Up to ${pkg.max_tenants}`} tenants`,
                          `${pkg.max_staff >= 999 ? "Unlimited" : `Up to ${pkg.max_staff}`} staff members`,
                        ].map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <div className="w-full py-2 text-center text-xs font-bold text-primary bg-primary/10 rounded-lg">
                          ✓ Current Plan
                        </div>
                      ) : (
                        <button
                          onClick={() => setUpgradeTarget(pkg)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer"
                        >
                          {mySubscription ? "Switch to This Plan" : "Subscribe"} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={upgradeTarget !== null} onOpenChange={o => !o && setUpgradeTarget(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
            <DialogDescription>
              You are switching to the <strong>{upgradeTarget?.name}</strong> plan
              {upgradeTarget?.price === 0 ? " (Free)" : ` ($${upgradeTarget?.price}/month)`}.
            </DialogDescription>
          </DialogHeader>
          {upgradeError && <p className="text-xs text-destructive font-medium">{upgradeError}</p>}
          <DialogFooter>
            <button onClick={() => setUpgradeTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={handleUpgrade} disabled={upgrading} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {upgrading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={o => !o && setCancelOpen(false)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your current subscription plan?
              This will remove all features and limits immediately.
            </DialogDescription>
          </DialogHeader>
          {cancelError && <p className="text-xs text-destructive font-medium">{cancelError}</p>}
          <DialogFooter>
            <button onClick={() => setCancelOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Close</button>
            <button onClick={handleCancelSubscription} disabled={cancelling} className="px-4 py-2 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Cancellation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
