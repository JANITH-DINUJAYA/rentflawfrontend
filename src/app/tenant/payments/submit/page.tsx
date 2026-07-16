"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  UploadCloud, FileCheck, AlertCircle, Camera, DollarSign, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubmittedPayment {
  id: string;
  invoiceId: string;
  amount: number;
  submittedAt: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectReason?: string;
}

const MY_PAYMENTS: SubmittedPayment[] = [
  { id: "PAY-009", invoiceId: "INV-004", amount: 450, submittedAt: "2026-06-15", status: "APPROVED" },
  { id: "PAY-008", invoiceId: "INV-003", amount: 450, submittedAt: "2026-05-14", status: "APPROVED" },
  { id: "PAY-007", invoiceId: "INV-002", amount: 480, submittedAt: "2026-04-25", status: "REJECTED", rejectReason: "Receipt amount does not match invoice total" }
];

export default function TenantSubmitPaymentPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [invoiceId, setInvoiceId] = React.useState("INV-005");
  const [submitted, setSubmitted] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount) return;
    setSubmitted(true);
  };

  const statusBadge = (status: SubmittedPayment["status"]) => {
    if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-500";
    if (status === "REJECTED") return "bg-destructive/10 text-destructive";
    return "bg-amber-500/10 text-amber-500";
  };

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
          {submitted ? (
            <Card className="border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FileCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black">Payment Submitted!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your receipt for <strong>{invoiceId}</strong> has been submitted for review. You will be notified once it's approved.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setFile(null); setPreview(null); setAmount(""); }}
                  className="mt-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  Submit Another
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Invoice selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="invoiceRef">Invoice Reference</Label>
                    <Input id="invoiceRef" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="INV-005" />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <Label htmlFor="amountPaid">Amount Paid ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="amountPaid" type="number" step="0.01" className="pl-9" placeholder="450.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div className="space-y-1.5">
                    <Label>Receipt / Proof of Payment</Label>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        dragging ? "border-primary bg-primary/5 scale-[1.01]" : preview ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-accent/20"
                      }`}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      />
                      {preview ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview} alt="Receipt preview" className="h-40 object-contain mx-auto rounded-xl" />
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                            className="absolute top-0 right-0 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
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
                            <p className="text-xs text-muted-foreground mt-0.5">or click to browse — JPG, PNG, PDF accepted</p>
                          </div>
                          <button type="button" className="mt-1 flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                            <Camera className="h-3.5 w-3.5" /> Choose file
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || !amount}
                    className="w-full py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                  >
                    Submit for Review
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Past submissions ──────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Past Submissions</h3>
          {MY_PAYMENTS.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono font-bold">{p.id}</p>
                    <p className="text-xs text-muted-foreground">{p.invoiceId} · {p.submittedAt}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xl font-black">${p.amount}</p>
                {p.status === "REJECTED" && p.rejectReason && (
                  <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <p>{p.rejectReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
