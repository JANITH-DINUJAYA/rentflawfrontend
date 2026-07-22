"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Loader2, AlertCircle, FileSignature, XCircle, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface Agreement {
  id: string;
  rent_amount: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  status: string;
  property: { name: string };
  room: { room_number: string };
  tenant: { first_name: string; last_name: string; email: string };
  landlord: { company_name: string | null };
}

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [terminateTarget, setTerminateTarget] = useState<Agreement | null>(null);
  const [terminatePending, setTerminatePending] = useState(false);
  const [terminateError, setTerminateError] = useState("");

  const fetchAgreements = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/agreements");
      setAgreements(res.data);
    } catch {
      setError("Failed to load platform rental agreements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  const handleTerminate = async () => {
    if (!terminateTarget) return;
    setTerminatePending(true);
    setTerminateError("");
    try {
      await api.patch(`/agreements/${terminateTarget.id}/terminate`, {
        exit_date: new Date().toISOString(),
      });
      setTerminateTarget(null);
      await fetchAgreements();
    } catch (err: any) {
      setTerminateError(err.response?.data?.message || "Failed to terminate lease agreement.");
    } finally {
      setTerminatePending(false);
    }
  };

  const filtered = agreements.filter(a =>
    `${a.tenant?.first_name || ""} ${a.tenant?.last_name || ""} ${a.property?.name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Rental Agreements</h2>
          <p className="text-sm text-muted-foreground">Monitor lease agreements and authorize tenant leave requests.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background w-full sm:w-60">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            className="text-sm bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchAgreements} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement / Tenant</TableHead>
                  <TableHead>Landlord Owner</TableHead>
                  <TableHead>Property / Room</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Security Deposit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {search ? `No agreements matching "${search}"` : "No agreements on the platform yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(a => (
                    <TableRow key={a.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <FileSignature className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm block">
                              {a.tenant?.first_name} {a.tenant?.last_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(a.start_date).toLocaleDateString()} — {new Date(a.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{a.landlord?.company_name || "Private Landlord"}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium block">{a.property?.name}</span>
                        <span className="text-xs text-muted-foreground">Room {a.room?.room_number}</span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">Rs {Number(a.rent_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-semibold">Rs {Number(a.security_deposit).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "ACTIVE"
                              ? "default"
                              : a.status === "TERMINATION_REQUESTED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {a.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(a.status === "ACTIVE" || a.status === "TERMINATION_REQUESTED") && (
                          <button
                            onClick={() => setTerminateTarget(a)}
                            className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                            title="Force Terminate Agreement / Accept leave"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Force Terminate Confirmation Dialog */}
      <Dialog open={terminateTarget !== null} onOpenChange={o => !o && setTerminateTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Terminate Rental Agreement
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate this lease agreement for tenant{" "}
              <strong>
                {terminateTarget?.tenant.first_name} {terminateTarget?.tenant.last_name}
              </strong>{" "}
              at <strong>{terminateTarget?.property.name}</strong>? This action terminates the lease and processes proration checks.
            </DialogDescription>
          </DialogHeader>
          {terminateError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold leading-relaxed">
              ⚠️ {terminateError}
            </div>
          )}
          <DialogFooter className="gap-2">
            <button onClick={() => setTerminateTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={handleTerminate} disabled={terminatePending} className="px-4 py-2 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {terminatePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Termination
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
