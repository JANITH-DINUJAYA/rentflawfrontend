"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  FileText, Search, Filter, DollarSign, Percent,
  CheckCircle2, AlertCircle, Clock, Plus, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Discount modal state
  const [discountInvoiceId, setDiscountInvoiceId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountSaving, setDiscountSaving] = useState(false);

  // Create manual invoice modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    agreement_id: "", type: "RENT", amount: "",
    due_date: "", billing_period_start: "", billing_period_end: "", discount: "0"
  });
  const [createError, setCreateError] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const [invoicesRes, agreementsRes] = await Promise.all([
        api.get("/invoices/landlord"),
        api.get("/agreements?status=ACTIVE"),
      ]);
      setInvoices(Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : []);
      setAgreements(Array.isArray(agreementsRes.data) ? agreementsRes.data : []);
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    const amount = Number(discountAmount);
    if (isNaN(amount) || amount <= 0) {
      setDiscountError("Please enter a valid positive discount amount.");
      return;
    }
    setDiscountSaving(true);
    try {
      await api.patch(`/invoices/${discountInvoiceId}/discount`, { discount: amount });
      setDiscountInvoiceId(null);
      setDiscountAmount("");
      await fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDiscountError(Array.isArray(msg) ? msg[0] : msg || "Failed to apply discount.");
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.agreement_id || !createForm.amount || !createForm.due_date) {
      setCreateError("Please fill all required fields.");
      return;
    }
    setCreateSaving(true);
    try {
      await api.post("/invoices", {
        agreement_id: createForm.agreement_id,
        type: createForm.type,
        amount: parseFloat(createForm.amount),
        discount: parseFloat(createForm.discount) || 0,
        due_date: new Date(createForm.due_date),
        billing_period_start: new Date(createForm.billing_period_start || createForm.due_date),
        billing_period_end: new Date(createForm.billing_period_end || createForm.due_date),
      });
      setShowCreate(false);
      setCreateForm({ agreement_id: "", type: "RENT", amount: "", due_date: "", billing_period_start: "", billing_period_end: "", discount: "0" });
      await fetchInvoices();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setCreateError(Array.isArray(msg) ? msg[0] : msg || "Failed to create invoice.");
    } finally {
      setCreateSaving(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const tenantName = inv.agreement?.tenant ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}` : "";
    const propertyName = inv.agreement?.property?.name || "";
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    const matchesSearch =
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-sm text-muted-foreground">Monitor rents, utilities, late charges, and apply custom discounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInvoices}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreateError(""); }}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenant, invoice ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:inline" />
          <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchInvoices} className="text-primary hover:underline text-xs cursor-pointer">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Billing Details</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const tenantName = inv.agreement?.tenant
                    ? `${inv.agreement.tenant.first_name} ${inv.agreement.tenant.last_name}`
                    : "Unknown Tenant";
                  const propertyName = inv.agreement?.property?.name || "—";
                  const roomNumber = inv.agreement?.room?.room_number || "—";
                  return (
                    <TableRow key={inv.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <p className="font-medium text-sm">{tenantName}</p>
                        <p className="text-xs text-muted-foreground">{propertyName} · Rm {roomNumber}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold">{inv.type}</Badge>
                        {inv.utility_bill && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {inv.utility_bill.type} 
                            {inv.utility_bill.meter_reading_current !== null && ` (${inv.utility_bill.meter_reading_previous} → ${inv.utility_bill.meter_reading_current} @ $${inv.utility_bill.rate_per_unit})`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p>Amount: ${Number(inv.amount).toFixed(2)}</p>
                        {Number(inv.discount) > 0 && <p className="text-emerald-500">Discount: -${Number(inv.discount).toFixed(2)}</p>}
                        {Number(inv.late_fee_applied) > 0 && <p className="text-destructive font-semibold">Late Fee: +${Number(inv.late_fee_applied).toFixed(2)}</p>}
                      </TableCell>
                      <TableCell className="font-bold">${Number(inv.total_due).toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {inv.status === "PAID" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> PAID
                          </Badge>
                        ) : inv.status === "OVERDUE" ? (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none font-bold">
                            <AlertCircle className="mr-1 h-3.5 w-3.5" /> OVERDUE
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold">
                            <Clock className="mr-1 h-3.5 w-3.5" /> PENDING
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => { setDiscountInvoiceId(inv.id); setDiscountError(""); setDiscountAmount(""); }}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Apply Discount"
                          >
                            <Percent className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No invoices match search filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Apply Discount Dialog */}
      <Dialog open={discountInvoiceId !== null} onOpenChange={(open) => !open && setDiscountInvoiceId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Deduct a flat amount from the pending invoice total.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplyDiscount} className="space-y-4 py-2">
            {discountError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {discountError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="discountAmount">Discount Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discountAmount"
                  type="number"
                  placeholder="e.g. 50"
                  className="pl-9"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setDiscountInvoiceId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={discountSaving}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {discountSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Apply Discount
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Manual Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Create Manual Invoice</DialogTitle>
            <DialogDescription>Manually generate an invoice for rent, damage, or other charges.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
            {createError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {createError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Active Agreement (Tenant)</Label>
              <Select value={createForm.agreement_id} onValueChange={v => v && setCreateForm(f => ({ ...f, agreement_id: v }))}>
                <SelectTrigger>
                  {createForm.agreement_id
                    ? <span className="flex flex-1 text-left truncate">{(() => { const agr = agreements.find(a => a.id === createForm.agreement_id); const tenant = agr?.tenant; return tenant ? `${tenant.first_name} ${tenant.last_name} — ${agr.property?.name || ""} Rm ${agr.room?.room_number || ""}` : createForm.agreement_id; })()}</span>
                    : <SelectValue placeholder="Choose active agreement" />}
                </SelectTrigger>
                <SelectContent>
                  {agreements.length === 0 ? (
                    <SelectItem value="_none" disabled>No active agreements found</SelectItem>
                  ) : agreements.map(agr => {
                    const tenant = agr.tenant;
                    const name = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unknown";
                    return (
                      <SelectItem key={agr.id} value={agr.id}>
                        {`${name} — ${agr.property?.name || ""} Rm ${agr.room?.room_number || ""}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Invoice Type</Label>
                <Select value={createForm.type} onValueChange={v => v && setCreateForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENT">Rent</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="LATE_FEE">Late Fee</SelectItem>
                    <SelectItem value="DAMAGE">Damage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invAmount">Amount ($)</Label>
                <Input id="invAmount" type="number" step="0.01" placeholder="0.00" value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invDiscount">Discount ($)</Label>
                <Input id="invDiscount" type="number" step="0.01" placeholder="0.00" value={createForm.discount} onChange={e => setCreateForm(f => ({ ...f, discount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invDueDate">Due Date</Label>
                <Input id="invDueDate" type="date" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="billStart">Billing Start</Label>
                <Input id="billStart" type="date" value={createForm.billing_period_start} onChange={e => setCreateForm(f => ({ ...f, billing_period_start: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billEnd">Billing End</Label>
                <Input id="billEnd" type="date" value={createForm.billing_period_end} onChange={e => setCreateForm(f => ({ ...f, billing_period_end: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={createSaving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
                {createSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Invoice
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
