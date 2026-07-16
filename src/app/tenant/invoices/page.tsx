"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface TenantInvoice {
  id: string;
  month: string;
  type: "RENT" | "UTILITY" | "LATE_FEE" | "DAMAGE";
  amount: number;
  discount: number;
  lateFeeApplied: number;
  totalDue: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
}

const SAMPLE_INVOICES: TenantInvoice[] = [
  { id: "INV-005", month: "July 2026", type: "RENT", amount: 450, discount: 0, lateFeeApplied: 0, totalDue: 450, dueDate: "2026-07-20", status: "PENDING" },
  { id: "INV-004", month: "June 2026", type: "RENT", amount: 450, discount: 0, lateFeeApplied: 0, totalDue: 450, dueDate: "2026-06-20", status: "PAID" },
  { id: "INV-003", month: "May 2026", type: "RENT", amount: 450, discount: 0, lateFeeApplied: 0, totalDue: 450, dueDate: "2026-05-20", status: "PAID" },
  { id: "INV-002", month: "April 2026", type: "RENT", amount: 450, discount: 0, lateFeeApplied: 30, totalDue: 480, dueDate: "2026-04-20", status: "OVERDUE" }
];

const STATUS_META = {
  PAID: { label: "Paid", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  PENDING: { label: "Pending", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  OVERDUE: { label: "Overdue", color: "text-destructive bg-destructive/10", icon: AlertCircle }
};

export default function TenantInvoicesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = SAMPLE_INVOICES.filter(inv => {
    return inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           inv.month.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Invoices</h2>
          <p className="text-sm text-muted-foreground">View and download your monthly rent and utility invoices.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice ID or month..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>Discounts/Fees</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const meta = STATUS_META[inv.status];
                const Icon = meta.icon;
                return (
                  <TableRow key={inv.id} className="hover:bg-accent/20 transition-colors">
                    <TableCell className="font-mono text-xs font-bold">{inv.id}</TableCell>
                    <TableCell className="font-semibold text-sm">{inv.month}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase border-none bg-accent/60 text-foreground">
                        {inv.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">${inv.amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.discount > 0 && <span className="text-emerald-500">-${inv.discount} discount</span>}
                      {inv.lateFeeApplied > 0 && <span className="text-destructive">+${inv.lateFeeApplied} late fee</span>}
                      {inv.discount === 0 && inv.lateFeeApplied === 0 && "—"}
                    </TableCell>
                    <TableCell className="font-bold text-sm">${inv.totalDue}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold border-none ${meta.color} flex items-center gap-1 w-fit`}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status !== "PAID" ? (
                        <Link
                          href="/tenant/payments/submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
                        >
                          <CreditCard className="h-3 w-3" /> Pay Now
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">Cleared</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

// Inline input helper to avoid shadcn Input imports error
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
