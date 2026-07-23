"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  UploadCloud, FileCheck, AlertCircle, DollarSign, X, Loader2, CheckCircle2, AlertOctagon, Clock, Landmark, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const STATUS_META = {
  APPROVED: { label: "Approved", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  PENDING_REVIEW: { label: "Pending Review", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  REJECTED: { label: "Rejected", color: "text-destructive bg-destructive/10", icon: AlertOctagon }
};

export default function TenantSubmitPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Form State
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasActiveLease, setHasActiveLease] = useState(true);
  const [landlordBank, setLandlordBank] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = async (preselectedInvoiceId: string | null) => {
    try {
      const [invoicesRes, submissionsRes, profileRes] = await Promise.all([
        api.get("/invoices/tenant"),
        api.get("/payments/tenant"),
        api.get("/tenants/profile"),
      ]);
      const allInvoices = Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : [];
      const unpaid = allInvoices.filter((inv: any) => inv.status === "PENDING" || inv.status === "OVERDUE");
      setInvoices(unpaid);
      
      const activeAgreement = Array.isArray(profileRes.data?.rental_agreements)
        ? profileRes.data.rental_agreements.find((a: any) => a.status === "ACTIVE")
        : null;
      setHasActiveLease(!!activeAgreement);
      if (activeAgreement?.landlord) {
        setLandlordBank(activeAgreement.landlord);
      }

      const targetId = preselectedInvoiceId || (unpaid.length > 0 ? unpaid[0].id : "");
      if (targetId) {
        const selected = unpaid.find((inv: any) => inv.id === targetId) || unpaid[0];
        if (selected) {
          setInvoiceId(selected.id);
          setAmount(Number(selected.total_due).toFixed(2));
        }
      }
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
    } catch (err) {
      console.error("Failed to load invoice lists and submissions history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const preselectedInvoiceId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("invoice_id")
      : null;
    loadData(preselectedInvoiceId);
  }, []);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const selected = invoices.find(inv => inv.id === id);
    if (selected) {
      setAmount(Number(selected.total_due).toFixed(2));
    }
  };

  const handleFileChange = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !invoiceId || !amount) {
      setFormError("Please select an invoice, enter an amount and upload a receipt.");
      return;
    }
    setUploading(true);
    setFormError("");
    try {
      // 1. Upload receipt via files service
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/files/upload", formData);
      const receiptUrl = uploadRes.data?.public_url;
      if (!receiptUrl) throw new Error("Storage URL missing in response.");

      // 2. Submit payment submission
      await api.post("/payments/submit", {
        invoice_id: invoiceId,
        amount_paid: parseFloat(amount),
        payment_date: new Date(),
        receipt_url: receiptUrl
      });

      setSuccess(true);
      setFile(null);
      setPreview(null);
      
      // Refresh Lists
      const [invoicesRes, submissionsRes] = await Promise.all([
        api.get("/invoices/tenant"),
        api.get("/payments/tenant"),
      ]);
      const allInvoices = Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : [];
      const unpaid = allInvoices.filter((inv: any) => inv.status === "PENDING" || inv.status === "OVERDUE");
      setInvoices(unpaid);
      if (unpaid.length > 0) {
        setInvoiceId(unpaid[0].id);
        setAmount(Number(unpaid[0].total_due).toFixed(2));
      } else {
        setInvoiceId("");
        setAmount("");
      }
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || err.message || "Failed to submit payment receipt.");
    } finally {
      setUploading(false);
    }
  };

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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submit Payment</h2>
        <p className="text-sm text-muted-foreground">Upload your proof of payment and it will be reviewed by your landlord.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Upload form ─────────────────────── */}
        <div className="lg:col-span-3">
          {success ? (
            <Card className="border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FileCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black">Payment Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your payment receipt has been submitted for review. You will be notified once it is reviewed.
                </p>
                <button
                  onClick={() => { setSuccess(false); setFormError(""); }}
                  className="mt-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Submit Another
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {formError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {!hasActiveLease && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      You do not have an active lease agreement. You cannot submit payments.
                    </div>
                  )}

                  {/* Invoice selector */}
                  <div className="space-y-1.5">
                    <Label>Select Invoice to Pay</Label>
                    {!hasActiveLease ? (
                      <div className="p-3 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                        Lease agreement is not active.
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                        All invoices are fully paid! No outstanding balances.
                      </div>
                    ) : (
                      <Select value={invoiceId} onValueChange={v => v && handleInvoiceChange(v)}>
                        <SelectTrigger className="w-full" disabled={!hasActiveLease}>
                          {invoiceId
                            ? <span className="flex flex-1 text-left truncate">{(() => { const inv = invoices.find(i => i.id === invoiceId); return inv ? `${inv.type} Invoice (${new Date(inv.due_date).toLocaleDateString()}) - Rs ${Number(inv.total_due).toFixed(2)}` : invoiceId; })()}</span>
                            : <SelectValue placeholder="Choose outstanding invoice" />}
                        </SelectTrigger>
                        <SelectContent>
                          {invoices.map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {`${inv.type} Invoice (${new Date(inv.due_date).toLocaleDateString()}) - Rs ${Number(inv.total_due).toFixed(2)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="amountPaid">Amount Paid (Rs)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amountPaid"
                        type="number"
                        step="0.01"
                        className="pl-9"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        disabled={invoices.length === 0 || !hasActiveLease}
                        required
                      />
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div className="space-y-1.5">
                    <Label>Receipt / Proof of Payment</Label>
                    <div
                      onDragOver={e => { if (hasActiveLease) { e.preventDefault(); setDragging(true); } }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={e => { if (hasActiveLease) handleDrop(e); }}
                      onClick={() => { if (hasActiveLease) fileRef.current?.click(); }}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                        !hasActiveLease ? "border-muted bg-muted/20 cursor-not-allowed opacity-60" : dragging ? "border-primary bg-primary/5 scale-[1.01] cursor-pointer" : preview ? "border-emerald-500/40 bg-emerald-500/5 cursor-pointer" : "border-border hover:border-primary/50 hover:bg-accent/20 cursor-pointer"
                      }`}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                        disabled={invoices.length === 0 || !hasActiveLease}
                      />
                      {preview ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt="Receipt preview" className="h-40 object-contain mx-auto rounded-xl" />
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                            className="absolute top-0 right-0 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-emerald-500 font-bold mt-2">{file?.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <div className="p-4 rounded-2xl bg-primary/10">
                            <UploadCloud className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Drop your receipt here</p>
                            <p className="text-xs text-muted-foreground mt-0.5">or click to browse — Images, PDFs accepted</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || invoices.length === 0 || !file || !hasActiveLease}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading receipt...
                      </>
                    ) : (
                      "Submit Payment Proof"
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Payment history list ──────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Landlord Bank Transfer Details */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" /> Bank Transfer Details
              </CardTitle>
              <CardDescription className="text-xs">Pay your landlord using the details below, then upload the receipt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              {landlordBank?.bank_name ? (
                <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-card">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="font-bold text-foreground">{landlordBank.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Holder:</span>
                    <span className="font-bold text-foreground">{landlordBank.account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-bold text-foreground select-all">{landlordBank.account_number}</span>
                  </div>
                  {landlordBank.branch_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-bold text-foreground">{landlordBank.branch_name}</span>
                    </div>
                  )}
                  {landlordBank.swift_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SWIFT / BIC:</span>
                      <span className="font-bold text-foreground select-all">{landlordBank.swift_code}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-medium flex items-start gap-2 leading-relaxed">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[11px] uppercase tracking-wide">No bank details added by landlord</p>
                    <p className="text-[10px] mt-0.5 opacity-90">Please contact your landlord directly to obtain their bank transfer details.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Verification History</CardTitle>
              <CardDescription className="text-xs">Receipts previously submitted and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissions.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  No payment submissions found.
                </div>
              ) : (
                submissions.map((sub) => {
                  const m = STATUS_META[sub.status as keyof typeof STATUS_META];
                  const Icon = m.icon;
                  return (
                    <div key={sub.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                          {sub.invoice?.type || "Rent"} Payment
                        </span>
                        <Badge variant="outline" className={`${m.color} border-none font-bold text-[9px] flex items-center gap-1`}>
                          <Icon className="h-3 w-3" /> {m.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Amount Paid:</span>
                        <span className="font-bold text-foreground">Rs {Number(sub.amount_paid).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Submitted Date:</span>
                        <span>{new Date(sub.payment_date).toLocaleDateString()}</span>
                      </div>
                      {sub.status === "REJECTED" && sub.notes && (
                        <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold border border-destructive/20 mt-1 leading-normal">
                          <strong>Reason:</strong> {sub.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
