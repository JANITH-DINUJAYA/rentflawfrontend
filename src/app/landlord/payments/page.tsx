"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentSubmission {
  id: string;
  tenantName: string;
  invoiceId: string;
  propertyName: string;
  roomNumber: string;
  amountPaid: number;
  paymentDate: string;
  receiptUrl: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  notes?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentSubmission[]>([
    { id: "PAY-001", tenantName: "Alice Vance", invoiceId: "INV-001", propertyName: "Greenwood Residence", roomNumber: "102", amountPaid: 450, paymentDate: "2026-07-14", receiptUrl: "#", status: "PENDING_REVIEW" },
    { id: "PAY-002", tenantName: "Marcus Brody", invoiceId: "INV-002", propertyName: "City Center Hostels", roomNumber: "205", amountPaid: 600, paymentDate: "2026-07-15", receiptUrl: "#", status: "PENDING_REVIEW" },
    { id: "PAY-003", tenantName: "Clara Oswald", invoiceId: "INV-003", propertyName: "Greenwood Residence", roomNumber: "108", amountPaid: 550, paymentDate: "2026-07-10", receiptUrl: "#", status: "APPROVED" },
    { id: "PAY-004", tenantName: "John Smith", invoiceId: "INV-004", propertyName: "Greenwood Residence", roomNumber: "101", amountPaid: 300, paymentDate: "2026-07-08", receiptUrl: "#", status: "REJECTED", notes: "Receipt image was blurry and unreadable" }
  ]);

  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [reviewPayment, setReviewPayment] = React.useState<PaymentSubmission | null>(null);
  const [rejectNotes, setRejectNotes] = React.useState("");
  const [showRejectForm, setShowRejectForm] = React.useState(false);

  const handleApprove = (id: string) => {
    setPayments(payments.map(p =>
      p.id === id ? { ...p, status: "APPROVED" } : p
    ));
    setReviewPayment(null);
  };

  const handleReject = (id: string) => {
    if (!rejectNotes.trim()) return;
    setPayments(payments.map(p =>
      p.id === id ? { ...p, status: "REJECTED", notes: rejectNotes } : p
    ));
    setReviewPayment(null);
    setRejectNotes("");
    setShowRejectForm(false);
  };

  const filtered = payments.filter(p => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesSearch =
      p.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = payments.filter(p => p.status === "PENDING_REVIEW").length;

  return (
    <DashboardLayout>
      {/* ─── Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Submissions</h2>
          <p className="text-sm text-muted-foreground">Review tenant-uploaded payment receipts and approve or reject them.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-semibold animate-pulse">
            <Clock className="h-4 w-4" />
            {pendingCount} pending review{pendingCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ─── Filters ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenant or invoice..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Submissions</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Payments Table ────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell className="font-bold">{p.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {p.tenantName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{p.propertyName} · Rm {p.roomNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{p.invoiceId}</TableCell>
                  <TableCell className="font-bold">${p.amountPaid}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.paymentDate}</TableCell>
                  <TableCell>
                    {p.status === "APPROVED" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approved
                      </Badge>
                    ) : p.status === "REJECTED" ? (
                      <Badge className="bg-destructive/10 text-destructive border-none font-bold">
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Rejected
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold animate-pulse">
                        <Clock className="mr-1 h-3.5 w-3.5" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => { setReviewPayment(p); setShowRejectForm(false); setRejectNotes(""); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                    >
                      <Eye className="h-3.5 w-3.5" /> Review
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No payment submissions match the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Review Dialog ─────────────────────────── */}
      <Dialog open={reviewPayment !== null} onOpenChange={(open) => !open && setReviewPayment(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Review Payment Receipt</DialogTitle>
            <DialogDescription>
              Carefully inspect the uploaded proof of payment before approving or rejecting.
            </DialogDescription>
          </DialogHeader>

          {reviewPayment && (
            <div className="space-y-4 py-2">
              {/* Payment details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-accent/20 rounded-xl border border-border text-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Tenant</p>
                  <p className="font-semibold">{reviewPayment.tenantName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Invoice</p>
                  <p className="font-semibold">{reviewPayment.invoiceId}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Amount Paid</p>
                  <p className="font-bold text-lg">${reviewPayment.amountPaid}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Payment Date</p>
                  <p className="font-semibold">{reviewPayment.paymentDate}</p>
                </div>
              </div>

              {/* Receipt URL */}
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground flex-1">Payment receipt attached</span>
                <a href={reviewPayment.receiptUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View Receipt <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Notes if rejected */}
              {reviewPayment.status === "REJECTED" && reviewPayment.notes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold">Rejection reason:</span> {reviewPayment.notes}</p>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="space-y-1.5 border-t border-border pt-3">
                  <Label htmlFor="rejectNotes">Rejection Reason (required)</Label>
                  <Input
                    id="rejectNotes"
                    placeholder="e.g. Receipt is unclear, wrong amount..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                  />
                </div>
              )}

              {/* Action buttons */}
              {reviewPayment.status === "PENDING_REVIEW" && (
                <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                  {!showRejectForm ? (
                    <>
                      <button
                        onClick={() => handleApprove(reviewPayment.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all duration-200"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Payment
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 shadow-md shadow-destructive/20 transition-all duration-200"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(reviewPayment.id)}
                        disabled={!rejectNotes.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <XCircle className="h-4 w-4" /> Confirm Rejection
                      </button>
                    </>
                  )}
                </DialogFooter>
              )}

              {reviewPayment.status !== "PENDING_REVIEW" && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  This submission is locked — status: <strong>{reviewPayment.status}</strong>
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
