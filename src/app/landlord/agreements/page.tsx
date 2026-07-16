"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FileSignature, AlertTriangle, CheckCircle2, Clock, Loader2, AlertCircle, LogOut, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type AgreementStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

interface Agreement {
  id: string;
  rent_amount: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  collection_day: number;
  leaving_option: string;
  status: AgreementStatus;
  tenant: { first_name: string; last_name: string; email: string; tenant_code: string };
  property: { name: string; type: string };
  room: { room_number: string; base_rent: number };
  invoices: { id: string; total_due: number; due_date: string; status: string }[];
}

const statusConfig: Record<AgreementStatus, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  ACTIVE: { label: "Active", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  EXPIRED: { label: "Expired", class: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  TERMINATED: { label: "Terminated", class: "bg-red-500/10 text-red-600 border-red-500/20" },
  TERMINATION_REQUESTED: { label: "⚠ Leave Requested", class: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 animate-pulse" },
};

export default function LandlordAgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Terminate / Accept Leave Dialog
  const [terminateTarget, setTerminateTarget] = useState<Agreement | null>(null);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [terminating, setTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState("");

  const fetchAgreements = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/agreements");
      setAgreements(res.data);
    } catch {
      setError("Failed to load rental agreements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  const handleTerminate = async () => {
    if (!terminateTarget) return;
    setTerminating(true);
    setTerminateError("");
    try {
      await api.patch(`/agreements/${terminateTarget.id}/terminate`, { exit_date: exitDate });
      setTerminateTarget(null);
      await fetchAgreements();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setTerminateError(Array.isArray(msg) ? msg[0] : msg || "Failed to terminate agreement.");
    } finally {
      setTerminating(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.patch(`/agreements/${id}/activate`);
      await fetchAgreements();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to activate agreement.");
    }
  };

  const terminationRequests = agreements.filter(a => a.status === "TERMINATION_REQUESTED");
  const summary = {
    active: agreements.filter(a => a.status === "ACTIVE").length,
    draft: agreements.filter(a => a.status === "DRAFT").length,
    terminated: agreements.filter(a => a.status === "TERMINATED" || a.status === "EXPIRED").length,
    requests: terminationRequests.length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rental Agreements</h2>
          <p className="text-sm text-muted-foreground">Manage, activate, and terminate tenant lease agreements.</p>
        </div>
        <button
          onClick={fetchAgreements}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active", count: summary.active, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Draft", count: summary.draft, color: "text-gray-400", bg: "bg-gray-500/10" },
          { label: "Ended", count: summary.terminated, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Leave Requests", count: summary.requests, color: "text-yellow-500", bg: "bg-yellow-500/10" },
        ].map(({ label, count, color, bg }) => (
          <Card key={label} className={summary.requests > 0 && label === "Leave Requests" ? "ring-2 ring-yellow-500/30" : ""}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-extrabold ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Termination Requests Banner */}
      {terminationRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 space-y-3">
          <p className="text-sm font-bold text-yellow-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {terminationRequests.length} tenant{terminationRequests.length > 1 ? "s have" : " has"} submitted a request to leave!
          </p>
          <div className="flex flex-wrap gap-2">
            {terminationRequests.map(agr => (
              <button
                key={agr.id}
                onClick={() => { setTerminateTarget(agr); setExitDate(new Date().toISOString().split("T")[0]); }}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg bg-yellow-500 text-white hover:opacity-90 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Review: {agr.tenant.first_name} {agr.tenant.last_name} — Room {agr.room.room_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agreements Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchAgreements} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Room</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Collection Day</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      No agreements yet. Create a rental agreement to get started.
                    </TableCell>
                  </TableRow>
                ) : agreements.map(agr => {
                  const s = statusConfig[agr.status];
                  return (
                    <TableRow key={agr.id} className={`hover:bg-accent/20 transition-colors ${agr.status === "TERMINATION_REQUESTED" ? "bg-yellow-500/5" : ""}`}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{agr.tenant.first_name} {agr.tenant.last_name}</p>
                          <p className="text-xs text-muted-foreground">{agr.tenant.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{agr.property.name}</p>
                          <p className="text-xs text-muted-foreground">Room {agr.room.room_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">${Number(agr.rent_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{agr.collection_day}th</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <p>{new Date(agr.start_date).toLocaleDateString()}</p>
                          <p>→ {new Date(agr.end_date).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.class}`}>
                          {s.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {agr.status === "DRAFT" && (
                            <button
                              onClick={() => handleActivate(agr.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          {(agr.status === "ACTIVE" || agr.status === "TERMINATION_REQUESTED") && (
                            <button
                              onClick={() => { setTerminateTarget(agr); setExitDate(new Date().toISOString().split("T")[0]); }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                                agr.status === "TERMINATION_REQUESTED"
                                  ? "bg-yellow-500 text-white hover:opacity-90 border-yellow-500"
                                  : "text-destructive hover:bg-destructive/10 border-destructive/20"
                              }`}
                            >
                              {agr.status === "TERMINATION_REQUESTED" ? "✓ Accept Leave" : "Terminate"}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Terminate / Accept Leave Dialog */}
      <Dialog open={terminateTarget !== null} onOpenChange={o => !o && setTerminateTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {terminateTarget?.status === "TERMINATION_REQUESTED" ? (
                <><CheckCircle2 className="h-5 w-5 text-yellow-500" /> Accept Leave Request</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-destructive" /> Terminate Agreement</>
              )}
            </DialogTitle>
            <DialogDescription>
              {terminateTarget?.status === "TERMINATION_REQUESTED"
                ? `${terminateTarget?.tenant.first_name} ${terminateTarget?.tenant.last_name} has requested to leave Room ${terminateTarget?.room.room_number}. Set the exit date and accept the request to terminate this agreement.`
                : `This will terminate the active agreement for ${terminateTarget?.tenant.first_name} ${terminateTarget?.tenant.last_name} (Room ${terminateTarget?.room.room_number}).`
              }
            </DialogDescription>
          </DialogHeader>

          {terminateError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{terminateError}</div>
          )}

          <div className="space-y-3 py-2">
            <Label htmlFor="exit-date">Exit Date</Label>
            <Input
              id="exit-date"
              type="date"
              value={exitDate}
              onChange={e => setExitDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Final invoice will be calculated based on the leaving option:{" "}
              <strong>{terminateTarget?.leaving_option?.replace(/_/g, " ")}</strong>
            </p>
          </div>

          <DialogFooter>
            <button onClick={() => setTerminateTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button
              onClick={handleTerminate}
              disabled={terminating}
              className={`px-4 py-2 text-sm font-bold rounded-lg text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                terminateTarget?.status === "TERMINATION_REQUESTED" ? "bg-yellow-500" : "bg-destructive"
              }`}
            >
              {terminating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {terminateTarget?.status === "TERMINATION_REQUESTED" ? "Confirm & Terminate" : "Terminate Agreement"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
