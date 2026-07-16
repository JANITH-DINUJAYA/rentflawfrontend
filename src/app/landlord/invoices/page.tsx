"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Invoice {
  id: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  type: "RENT" | "UTILITY" | "LATE_FEE" | "DAMAGE";
  amount: number;
  discount: number;
  lateFeeApplied: number;
  totalDue: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([
    { id: "INV-001", tenantName: "John Smith", propertyName: "Greenwood Residence", roomNumber: "101", type: "RENT", amount: 550, discount: 0, lateFeeApplied: 0, totalDue: 550, dueDate: "2026-07-20", status: "PENDING" },
    { id: "INV-002", tenantName: "Jane Doe", propertyName: "City Center Hostels", roomNumber: "204", type: "RENT", amount: 450, discount: 50, lateFeeApplied: 0, totalDue: 400, dueDate: "2026-07-18", status: "PENDING" },
    { id: "INV-003", tenantName: "Bob Johnson", propertyName: "Greenwood Residence", roomNumber: "102", type: "RENT", amount: 500, discount: 0, lateFeeApplied: 50, totalDue: 550, dueDate: "2026-07-10", status: "OVERDUE" },
    { id: "INV-004", tenantName: "Emily Davis", propertyName: "Greenwood Residence", roomNumber: "105", type: "UTILITY", amount: 75, discount: 0, lateFeeApplied: 0, totalDue: 75, dueDate: "2026-07-05", status: "PAID" }
  ]);

  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Discount modal state
  const [discountInvoiceId, setDiscountInvoiceId] = React.useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [discountError, setDiscountError] = React.useState("");

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");

    const amount = Number(discountAmount);
    if (isNaN(amount) || amount <= 0) {
      setDiscountError("Please enter a valid positive discount amount");
      return;
    }

    setInvoices(invoices.map((inv) => {
      if (inv.id === discountInvoiceId) {
        const newTotal = Math.max(0, inv.amount - amount + inv.lateFeeApplied);
        return {
          ...inv,
          discount: amount,
          totalDue: newTotal
        };
      }
      return inv;
    }));

    setDiscountInvoiceId(null);
    setDiscountAmount("");
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    const matchesSearch = 
      inv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      {/* ─── Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-sm text-muted-foreground">Monitor rents, utilities, late charges, and apply custom discounts.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200">
          <Plus className="mr-1.5 h-4 w-4" /> Create Manual Invoice
        </button>
      </div>

      {/* ─── Filters & Search ───────────────────────── */}
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

      {/* ─── Invoices Table ────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
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
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell className="font-bold">{inv.id}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{inv.tenantName}</p>
                    <p className="text-xs text-muted-foreground">{inv.propertyName} • Rm {inv.roomNumber}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {inv.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p>Amount: ${inv.amount}</p>
                    {inv.discount > 0 && <p className="text-emerald-500">Discount: -${inv.discount}</p>}
                    {inv.lateFeeApplied > 0 && <p className="text-destructive font-semibold">Late Fee: +${inv.lateFeeApplied}</p>}
                  </TableCell>
                  <TableCell className="font-bold">${inv.totalDue}</TableCell>
                  <TableCell className="text-xs">{inv.dueDate}</TableCell>
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
                        onClick={() => setDiscountInvoiceId(inv.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Apply Discount"
                      >
                        <Percent className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No invoices match search filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Apply Discount Dialog ─────────────────── */}
      <Dialog open={discountInvoiceId !== null} onOpenChange={(open) => !open && setDiscountInvoiceId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Deduct a flat amount from the pending invoice total for {discountInvoiceId}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyDiscount} className="space-y-4 py-2">
            {discountError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {discountError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="discountAmount">Discount Flat Value ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="discountAmount"
                  type="number"
                  placeholder="e.g. 50"
                  className="pl-9"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setDiscountInvoiceId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
              >
                Apply Discount
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
