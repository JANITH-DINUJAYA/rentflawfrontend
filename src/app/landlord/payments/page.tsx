"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  DollarSign, Search, CheckCircle2, XCircle, Eye,
  Clock, AlertCircle, ExternalLink, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [reviewPayment, setReviewPayment] = useState<any | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/payments/landlord");
      // Response is an array or paginated object
      const data = Array.isArray(res.data) ? res.data : (res.data?.submissions || res.data?.data || []);
      setPayments(data);
    } catch {
      setError("Failed to load payment submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/payments/${id}/approve`);
      setReviewPayment(null);
      await fetchPayments();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Failed to approve payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectNotes.trim()) return;
    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/payments/${id}/reject`, { notes: rejectNotes });
      setReviewPayment(null);
      setRejectNotes("");
      setShowRejectForm(false);
      await fetchPayments();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Failed to reject payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = payments.filter(p => {
    const tenantName = p.tenant
      ? `${p.tenant.first_name} ${p.tenant.last_name}`
      : "";
    const invoiceId = p.invoice_id || "";
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesSearch =
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = payments.filter(p => p.status === "PENDING_REVIEW").length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Submissions</h2>
          <p className="text-sm text-muted-foreground">Review tenant-uploaded payment receipts and approve or reject them.</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-semibold animate-pulse">
              <Clock className="h-4 w-4" />
              {pendingCount} pending review{pendingCount > 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={fetchPayments}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Export Controls */}
      <div className="mt-6">
        <TableExportControls
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search payments by tenant or invoice..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="All Statuses"
          filterOptions={[
            { label: "Pending Review", value: "PENDING_REVIEW" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
          tableData={filtered.map(p => ({
            tenant: p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : "N/A",
            invoice_id: p.invoice_id || "N/A",
            amount: `$${Number(p.amount_paid).toFixed(2)}`,
            method: p.payment_method || "SLIP_UPLOAD",
            date: new Date(p.submitted_at).toLocaleDateString(),
            status: p.status,
          }))}
          columns={[
            { key: "tenant", label: "Tenant" },
            { key: "invoice_id", label: "Invoice ID" },
            { key: "amount", label: "Amount Paid" },
            { key: "method", label: "Method" },
            { key: "date", label: "Date Submitted" },
            { key: "status", label: "Status" },
          ]}
          filename="payments_report"
          title="Payment Submissions Report"
        />
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchPayments} className="text-primary hover:underline text-xs cursor-pointer">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Room</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const tenantName = p.tenant
                    ? `${p.tenant.first_name} ${p.tenant.last_name}`
                    : "Unknown Tenant";
                  const propertyName = p.invoice?.agreement?.property?.name || "—";
                  const roomNumber = p.invoice?.agreement?.room?.room_number || "—";
                  return (
                    <TableRow key={p.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {tenantName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tenantName}</p>
                            <p className="text-xs text-muted-foreground">{p.tenant?.email || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{propertyName}</p>
                        <p className="text-xs text-muted-foreground">Rm {roomNumber}</p>
                      </TableCell>
                      <TableCell className="font-bold">${Number(p.amount_paid).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.payment_date || p.created_at).toLocaleDateString()}
                      </TableCell>
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
                          onClick={() => { setReviewPayment(p); setShowRejectForm(false); setRejectNotes(""); setActionError(""); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No payment submissions match the filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
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
              {actionError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {actionError}
                </div>
              )}

              {/* Payment details */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-accent/20 rounded-xl border border-border text-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Tenant</p>
                  <p className="font-semibold">
                    {reviewPayment.tenant ? `${reviewPayment.tenant.first_name} ${reviewPayment.tenant.last_name}` : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Invoice Type</p>
                  <p className="font-semibold">{reviewPayment.invoice?.type || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Amount Paid</p>
                  <p className="font-bold text-lg">${Number(reviewPayment.amount_paid).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Invoice Total Due</p>
                  <p className="font-semibold">${Number(reviewPayment.invoice?.total_due || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Payment Date</p>
                  <p className="font-semibold">{new Date(reviewPayment.payment_date || reviewPayment.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Reviewed By</p>
                  <p className="font-semibold">
                    {reviewPayment.reviewer ? `${reviewPayment.reviewer.first_name} ${reviewPayment.reviewer.last_name}` : "Not yet reviewed"}
                  </p>
                </div>
              </div>

              {/* Receipt URL */}
              {reviewPayment.receipt_url && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground flex-1">Payment receipt attached</span>
                  <a
                    href={reviewPayment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Receipt <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

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
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve Payment
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 shadow-md shadow-destructive/20 transition-all duration-200 cursor-pointer disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowRejectForm(false)}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(reviewPayment.id)}
                        disabled={!rejectNotes.trim() || actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Confirm Rejection
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
