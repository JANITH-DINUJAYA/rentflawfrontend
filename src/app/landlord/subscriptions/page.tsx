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
  is_custom?: boolean;
}

interface MySubscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  package: Package;
}

export default function LandlordSubscriptionsPage() {
  const [mySubscription, setMySubscription] = useState<MySubscription | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [upgradeTarget, setUpgradeTarget] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "BANK">("CARD");
  const [bankSlipFile, setBankSlipFile] = useState<File | null>(null);
  const [bankNotes, setBankNotes] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // Custom Package Request state
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ max_properties: 50, max_tenants: 200, max_staff: 10, notes: "" });
  const [requestingCustom, setRequestingCustom] = useState(false);

  // Cancel subscription states
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subRes, pkgRes, bankRes, reqRes] = await Promise.all([
        api.get("/subscriptions/my-subscription").catch(() => ({ data: null })),
        api.get("/subscriptions/packages"),
        api.get("/system/bank-accounts").catch(() => ({ data: [] })),
        api.get("/subscriptions/custom-requests").catch(() => ({ data: [] })),
      ]);
      setMySubscription(subRes.data);
      setPackages(pkgRes.data);
      setBankAccounts(bankRes.data);
      setCustomRequests(reqRes.data);
    } catch {
      setError("Failed to load subscription information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingCustom(true);
    try {
      await api.post("/subscriptions/custom-request", customForm);
      alert("Your custom package request has been submitted! Our team will review and approve a custom plan price for you.");
      setCustomModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit custom request");
    } finally {
      setRequestingCustom(false);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradeTarget) return;
    setUpgrading(true);
    setUpgradeError("");
    try {
      if (paymentMethod === "BANK") {
        if (!bankSlipFile) {
          setUpgradeError("Please attach your bank transfer payment receipt.");
          setUpgrading(false);
          return;
        }

        // Upload receipt
        const formData = new FormData();
        formData.append("file", bankSlipFile);
        const uploadRes = await api.post("/files/upload", formData);
        const receiptUrl = uploadRes.data?.public_url;

        // Submit bank transfer payment
        await api.post("/subscriptions/bank-transfer", {
          package_id: upgradeTarget.id,
          amount: Number(upgradeTarget.price),
          receipt_url: receiptUrl,
          notes: bankNotes,
        });

        alert("Bank transfer payment slip submitted! SaaS Admin will review and activate your plan.");
        setUpgradeTarget(null);
        setBankSlipFile(null);
        setBankNotes("");
        fetchData();
        return;
      }

      // Card payment flow
      if (Number(upgradeTarget.price) === 0) {
        await api.post("/subscriptions/upgrade", { packageId: upgradeTarget.id });
        setUpgradeTarget(null);
        await fetchData();
        return;
      }

      // Initiate PayHere
      const res = await api.post("/payments/payhere/initiate-subscription", {
        packageId: upgradeTarget.id,
      });
      const payhereParams = res.data;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription & Billing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your SaaS plan, upgrade via Card or Bank Transfer, or request a custom package.</p>
        </div>
        <button
          onClick={() => setCustomModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
        >
          <Crown className="h-4 w-4" /> Request Custom Package
        </button>
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
        <div className="space-y-8 mt-6">
          {/* Current Plan */}
          {mySubscription && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Current Plan</p>
                    <CardTitle className="text-2xl font-extrabold mt-1 flex items-center gap-2">
                      {mySubscription.package.name}
                      {mySubscription.package.is_custom && (
                        <Badge className="bg-purple-500 text-white text-[10px]">CUSTOM PLAN</Badge>
                      )}
                    </CardTitle>
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

          {/* Available Packages */}
          <div>
            <h3 className="text-lg font-bold mb-4">Available Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {packages.map((pkg, i) => {
                const isCurrentPlan = mySubscription?.package.id === pkg.id;
                return (
                  <Card key={pkg.id} className={`relative overflow-hidden transition-all ${isCurrentPlan ? "border-primary ring-1 ring-primary/30" : "hover:shadow-lg"}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Crown className="h-5 w-5" />
                        </div>
                        {pkg.is_custom && (
                          <Badge className="bg-purple-600 text-white text-[9px]">EXCLUSIVELY FOR YOU</Badge>
                        )}
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
                          Select Plan <ArrowRight className="h-3.5 w-3.5" />
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

      {/* Upgrade / Payment Modal */}
      <Dialog open={!!upgradeTarget} onOpenChange={() => setUpgradeTarget(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subscribe to {upgradeTarget?.name}</DialogTitle>
            <DialogDescription>
              Amount due: <span className="font-bold text-foreground">${upgradeTarget?.price}/month</span>. Choose your payment method below.
            </DialogDescription>
          </DialogHeader>

          {upgradeError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
              {upgradeError}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <div className="flex rounded-xl bg-accent/20 p-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  paymentMethod === "CARD" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💳 Credit / Debit Card (PayHere)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  paymentMethod === "BANK" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🏦 Bank Transfer
              </button>
            </div>

            {paymentMethod === "CARD" ? (
              <div className="p-4 rounded-xl border border-border bg-accent/10 text-xs text-muted-foreground space-y-2">
                <p className="font-bold text-foreground">Instant Online Activation</p>
                <p>You will be redirected to PayHere secure checkout. Your plan will activate automatically upon payment.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* Platform Bank Accounts List */}
                <div className="p-3 rounded-xl border border-border bg-accent/10 space-y-2">
                  <p className="text-xs font-bold text-foreground">SaaS Platform Bank Accounts:</p>
                  {bankAccounts.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Contact support for bank details.</p>
                  ) : (
                    bankAccounts.map((acc) => (
                      <div key={acc.id} className="text-[11px] border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                        <p className="font-bold text-primary">{acc.bank_name}</p>
                        <p>Account: <span className="font-mono font-bold text-foreground">{acc.account_number}</span> ({acc.account_name})</p>
                        {acc.branch_name && <p className="text-muted-foreground">Branch: {acc.branch_name}</p>}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Upload Bank Transfer Receipt Slip *</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setBankSlipFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Notes / Reference No. (Optional)</label>
                  <textarea
                    placeholder="e.g. Transferred via Online Banking, Ref: 987654"
                    value={bankNotes}
                    onChange={e => setBankNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs min-h-[60px]"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setUpgradeTarget(null)}
              className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {paymentMethod === "CARD" ? "Proceed to Checkout" : "Submit Bank Slip"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Custom Package Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> Request Custom Package
            </h3>
            <p className="text-xs text-muted-foreground">
              Specify your required limits and our admin team will create a tailored pricing plan for your account.
            </p>
            <form onSubmit={handleCustomRequestSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">Max Properties</label>
                  <input
                    type="number"
                    min="1"
                    value={customForm.max_properties}
                    onChange={e => setCustomForm(f => ({ ...f, max_properties: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-border bg-background text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Max Tenants</label>
                  <input
                    type="number"
                    min="1"
                    value={customForm.max_tenants}
                    onChange={e => setCustomForm(f => ({ ...f, max_tenants: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-border bg-background text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">Max Staff</label>
                  <input
                    type="number"
                    min="1"
                    value={customForm.max_staff}
                    onChange={e => setCustomForm(f => ({ ...f, max_staff: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-border bg-background text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">Additional Notes / Specifications</label>
                <textarea
                  placeholder="e.g. We operate multi-city student housing complexes requiring dedicated account manager."
                  value={customForm.notes}
                  onChange={e => setCustomForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingCustom}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {requestingCustom ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your access will revert to free plan limits.
            </DialogDescription>
          </DialogHeader>
          {cancelError && <p className="text-xs text-destructive font-medium">{cancelError}</p>}
          <DialogFooter>
            <button
              onClick={() => setCancelOpen(false)}
              className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent cursor-pointer"
            >
              Keep My Plan
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
