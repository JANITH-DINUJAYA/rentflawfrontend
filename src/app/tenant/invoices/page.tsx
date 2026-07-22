"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, CreditCard, CheckCircle2, Clock, AlertCircle, Loader2, Landmark, FileImage, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import { api } from "@/lib/api";

const STATUS_META = {
  PAID: { label: "Paid", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  PENDING: { label: "Pending", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Overdue", color: "text-destructive bg-destructive/10", icon: AlertCircle }
};

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Payment selection modal
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [initiatingPayHere, setInitiatingPayHere] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentStatusAlert, setPaymentStatusAlert] = useState<"success" | "cancelled" | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/invoices/tenant");
      setInvoices(Array.isArray(res.data?.invoices) ? res.data.invoices : []);
    } catch {
      setError("Failed to load your invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Check query parameters for payment status return
    if (typeof window !== "undefined") {
      const status = new URLSearchParams(window.location.search).get("status");
      if (status === "success") {
        setPaymentStatusAlert("success");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (status === "cancelled") {
        setPaymentStatusAlert("cancelled");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handlePayHereCheckout = async () => {
    if (!paymentTarget) return;
    setInitiatingPayHere(true);
    setPayError("");
    try {
      const res = await api.post("/payments/payhere/initiate", { invoice_id: paymentTarget.id });
      const payhereParams = res.data;

      // Submit form programmatically via HTML POST redirection to sandbox checkout
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payhere.lk/pay/checkout";

      Object.keys(payhereParams).forEach((key) => {
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
      setPayError(err?.response?.data?.message || err?.message || "Failed to initiate payment gateway.");
      setInitiatingPayHere(false);
    }
  };

  const handleLocalBypassSettle = async () => {
    if (!paymentTarget) return;
    setInitiatingPayHere(true);
    setPayError("");
    try {
      await api.post("/payments/payhere/local-bypass", { invoice_id: paymentTarget.id });
      setPaymentTarget(null);
      await fetchInvoices();
    } catch (err: any) {
      setPayError(err?.response?.data?.message || "Local bypass execution failed.");
    } finally {
      setInitiatingPayHere(false);
    }
  };

  const filtered = invoices.filter(inv => {
    const period = inv.billing_period_start
      ? new Date(inv.billing_period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "";
    const matchSearch =
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusKeys = ["ALL", "PENDING", "OVERDUE", "PAID"] as const;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Invoices</h2>
          <p className="text-sm text-muted-foreground">View all your monthly rent and utility invoices.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <FileText className="h-4 w-4" />
            {invoices.length} total invoice{invoices.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by type, period or invoice ID..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusKeys.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card border-border text-muted-foreground hover:bg-accent/40"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              {" "}({s === "ALL" ? invoices.length : invoices.filter(i => i.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Adjustments</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const status = inv.status as keyof typeof STATUS_META;
                  const meta = STATUS_META[status] || STATUS_META.PENDING;
                  const Icon = meta.icon;
                  const period = inv.billing_period_start
                    ? new Date(inv.billing_period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "—";

                  return (
                    <TableRow key={inv.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell className="font-semibold text-sm">{period}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase border-none bg-accent/60 text-foreground">
                          {inv.type}
                        </Badge>
                        {inv.utility_bill && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {inv.utility_bill.type} 
                            {inv.utility_bill.meter_reading_current !== null && ` (${inv.utility_bill.meter_reading_previous} → ${inv.utility_bill.meter_reading_current} @ $${inv.utility_bill.rate_per_unit})`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">Rs {Number(inv.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground space-y-0.5">
                        {Number(inv.discount) > 0 && (
                          <p className="text-emerald-500">-Rs {Number(inv.discount).toFixed(2)} discount</p>
                        )}
                        {Number(inv.late_fee_applied) > 0 && (
                          <p className="text-destructive">+Rs {Number(inv.late_fee_applied).toFixed(2)} late fee</p>
                        )}
                        {Number(inv.discount) === 0 && Number(inv.late_fee_applied) === 0 && "—"}
                      </TableCell>
                      <TableCell className="font-bold text-sm">Rs {Number(inv.total_due).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold border-none ${meta.color} flex items-center gap-1 w-fit`}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status !== "PAID" ? (
                          <button
                            onClick={() => { setPaymentTarget(inv); setPayError(""); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer"
                          >
                            <CreditCard className="h-3 w-3" /> Pay Now
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">Cleared</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {invoices.length === 0 ? "No invoices found yet." : "No invoices match the current filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Choice Payment Dialog */}
      <Dialog open={paymentTarget !== null} onOpenChange={o => !o && setPaymentTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Settle Invoice</DialogTitle>
            <DialogDescription>
              Choose your preferred method to clear this billing cycle.
            </DialogDescription>
          </DialogHeader>

          {payError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {payError}
            </div>
          )}

          {paymentTarget && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Type:</span>
                  <span className="font-bold uppercase">{paymentTarget.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Period:</span>
                  <span className="font-bold">
                    {new Date(paymentTarget.billing_period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-primary/10 pt-2 text-sm">
                  <span className="font-bold text-foreground">Amount Due:</span>
                  <span className="font-extrabold text-primary">Rs {Number(paymentTarget.total_due).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Instant Card Payment option */}
                <button
                  onClick={handlePayHereCheckout}
                  disabled={initiatingPayHere}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/40 text-left transition-all duration-200 cursor-pointer disabled:opacity-60"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      Pay Online (PayHere Card Checkout)
                    </p>
                    <p className="text-[11px] text-muted-foreground">Open payment gateway. Requires review and manual approval by landlord.</p>
                  </div>
                </button>

                {/* Manual Slip upload option */}
                <Link
                  href={{
                    pathname: "/tenant/payments/submit",
                    query: { invoice_id: paymentTarget.id }
                  }}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/40 text-left transition-all duration-200 cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Upload Bank Transfer Receipt</p>
                    <p className="text-[11px] text-muted-foreground">Submit a screenshot/photo of physical deposit slips manually.</p>
                  </div>
                </Link>
                {/* Local Dev instant bypass button */}
                <button
                  onClick={handleLocalBypassSettle}
                  disabled={initiatingPayHere}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-dashed border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 cursor-pointer disabled:opacity-60"
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-amber-700">Direct Payment</p>
                    <p className="text-[11px] text-amber-600/80">Simulates gateway completion; submits payment for review & manual landlord approval.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setPaymentTarget(null)}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Redirect Return Alert Dialog */}
      <Dialog open={paymentStatusAlert !== null} onOpenChange={o => !o && setPaymentStatusAlert(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentStatusAlert === "success" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span>Payment Succeeded</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span>Payment Cancelled</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {paymentStatusAlert === "success" ? (
                "Your card payment transaction was submitted successfully. The landlord has been notified and will verify the payout to clear your invoice."
              ) : (
                "The payment gateway checkout was cancelled. No charges were made. You can try checking out again or upload a manual slip."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setPaymentStatusAlert(null)}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              Okay
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
