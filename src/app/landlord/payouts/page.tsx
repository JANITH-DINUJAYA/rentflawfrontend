"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  DollarSign, Search, CheckCircle2, AlertCircle, Loader2, RefreshCw, Landmark, ArrowRightLeft, ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type TabType = "REFUNDS" | "CREDITS";

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("REFUNDS");
  const [refunds, setRefunds] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Payout action state
  const [payoutTarget, setPayoutTarget] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "REFUNDS") {
        const res = await api.get("/agreements/refunds/list");
        setRefunds(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await api.get("/tenants/with-credit");
        setCredits(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError("Failed to fetch payout records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleConfirmPayout = async () => {
    if (!payoutTarget) return;
    setActionLoading(true);
    setActionError("");
    try {
      if (activeTab === "REFUNDS") {
        await api.patch(`/agreements/refunds/${payoutTarget.id}/pay`);
      } else {
        await api.post(`/tenants/${payoutTarget.id}/payout-credit`);
      }
      setPayoutTarget(null);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Failed to process payout.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(r => {
    const tenant = r.agreement?.tenant;
    const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : "";
    const propertyName = r.agreement?.property?.name || "";
    return (
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      propertyName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredCredits = credits.filter(c => {
    const tenantName = `${c.first_name} ${c.last_name}`;
    const code = c.tenant_code || "";
    return (
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payouts & Refunds</h2>
          <p className="text-sm text-muted-foreground">Manage and settle tenant security deposit refunds and credit payout distributions.</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mt-4">
        <button
          onClick={() => { setActiveTab("REFUNDS"); setSearchQuery(""); }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "REFUNDS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Landmark className="h-4 w-4" /> Security Deposit Refunds
        </button>
        <button
          onClick={() => { setActiveTab("CREDITS"); setSearchQuery(""); }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "CREDITS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" /> Tenant Overpaid Credits
        </button>
      </div>

      {/* Filter / Search */}
      <div className="relative w-full sm:w-80 mt-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={activeTab === "REFUNDS" ? "Search tenant or property..." : "Search tenant name or code..."}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content Area */}
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <AlertCircle className="h-9 w-9 text-destructive" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={fetchData} className="text-primary hover:underline text-xs cursor-pointer">Retry</button>
          </div>
        ) : activeTab === "REFUNDS" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property / Room</TableHead>
                    <TableHead>Deduction Amount</TableHead>
                    <TableHead>Final Payout</TableHead>
                    <TableHead>Payout Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        No deposit refunds pending or recorded.
                      </TableCell>
                    </TableRow>
                  ) : filteredRefunds.map(ref => {
                    const tenant = ref.agreement?.tenant;
                    const property = ref.agreement?.property;
                    const room = ref.agreement?.room;
                    return (
                      <TableRow key={ref.id} className="hover:bg-accent/20 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{tenant ? `${tenant.first_name} ${tenant.last_name}` : "—"}</p>
                            <p className="text-xs text-muted-foreground">{tenant?.email || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{property?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">Room {room?.room_number || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-semibold text-destructive">Rs {Number(ref.deductions).toFixed(2)}</p>
                            {ref.reason && (
                              <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]" title={ref.reason}>
                                "{ref.reason}"
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-extrabold text-emerald-600">
                          Rs {Number(ref.refund_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {ref.is_paid ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Paid</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 font-bold">Unpaid / Settle Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!ref.is_paid && (
                            <button
                              onClick={() => setPayoutTarget(ref)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Tenant Code</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Credit Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                        No tenants found with overpaid credit balances.
                      </TableCell>
                    </TableRow>
                  ) : filteredCredits.map(c => (
                    <TableRow key={c.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono font-semibold">{c.tenant_code || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-sm font-extrabold text-primary">
                        Rs {Number(c.credit_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setPayoutTarget(c)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-all cursor-pointer"
                        >
                          Settle & Reset
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Payout Dialog */}
      <Dialog open={payoutTarget !== null} onOpenChange={o => !o && setPayoutTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /> Confirm Manual Payout</DialogTitle>
            <DialogDescription>
              Confirm you have physically sent the money to the tenant via bank transfer, cash, or check.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{actionError}</div>
          )}

          {payoutTarget && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient Name:</span>
                <span className="font-bold">
                  {activeTab === "REFUNDS"
                    ? `${payoutTarget.agreement?.tenant?.first_name} ${payoutTarget.agreement?.tenant?.last_name}`
                    : `${payoutTarget.first_name} ${payoutTarget.last_name}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payout Type:</span>
                <span className="font-bold">{activeTab === "REFUNDS" ? "Security Deposit Refund" : "Overpayment Balance Credit"}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-500/10 pt-2 text-sm">
                <span className="font-bold text-foreground">Total Payout Amount:</span>
                <span className="font-extrabold text-emerald-600">
                  Rs {activeTab === "REFUNDS" ? Number(payoutTarget.refund_amount).toFixed(2) : Number(payoutTarget.credit_amount).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <button onClick={() => setPayoutTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button
              onClick={handleConfirmPayout}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-500 text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, Settle Payout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
