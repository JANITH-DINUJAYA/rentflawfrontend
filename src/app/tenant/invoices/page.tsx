"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, CreditCard, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
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

  useEffect(() => {
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
    fetchInvoices();
  }, []);

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
                      </TableCell>
                      <TableCell className="text-sm">${Number(inv.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground space-y-0.5">
                        {Number(inv.discount) > 0 && (
                          <p className="text-emerald-500">-${Number(inv.discount).toFixed(2)} discount</p>
                        )}
                        {Number(inv.late_fee_applied) > 0 && (
                          <p className="text-destructive">+${Number(inv.late_fee_applied).toFixed(2)} late fee</p>
                        )}
                        {Number(inv.discount) === 0 && Number(inv.late_fee_applied) === 0 && "—"}
                      </TableCell>
                      <TableCell className="font-bold text-sm">${Number(inv.total_due).toFixed(2)}</TableCell>
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
    </DashboardLayout>
  );
}
