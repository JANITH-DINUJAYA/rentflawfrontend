"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileSignature, Calendar, Building2, Home, User, DollarSign, Clock,
  AlertTriangle, Loader2, AlertCircle, CheckCircle2, LogOut, Check
} from "lucide-react";
import { api } from "@/lib/api";

type AgreementStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

interface Agreement {
  id: string;
  rent_amount: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  collection_day: number;
  grace_period_days: number;
  late_fee_flat: number;
  leaving_option: string;
  leaving_rule: string | null;
  status: AgreementStatus;
  property: { name: string; address: string; type: string };
  room: { room_number: string };
  landlord: {
    company_name: string | null;
    user: { first_name: string; last_name: string; phone: string };
  };
}

const statusConfig: Record<AgreementStatus, { label: string; class: string; icon: React.ComponentType<any> }> = {
  DRAFT: { label: "Pending Invitation", class: "bg-blue-500/10 text-blue-500", icon: Clock },
  ACTIVE: { label: "Active", class: "bg-emerald-500/10 text-emerald-500", icon: CheckCircle2 },
  EXPIRED: { label: "Expired", class: "bg-orange-500/10 text-orange-500", icon: AlertCircle },
  TERMINATED: { label: "Terminated", class: "bg-red-500/10 text-red-500", icon: AlertCircle },
  TERMINATION_REQUESTED: { label: "Leave Requested", class: "bg-yellow-500/10 text-yellow-600", icon: LogOut },
};

const leavingOptionLabel: Record<string, string> = {
  PAY_STAY_DATES: "Pay Stay Dates — Prorated rent for actual days stayed in exit month",
  PAY_FULL_MONTH: "Pay Full Month — Full month's rent due regardless of exit date",
  DECIDE_IN_AGREEMENT: "Decided in Agreement — See leaving rule below",
};

export default function TenantAgreementPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Request to leave
  const [leaveTarget, setLeaveTarget] = useState<Agreement | null>(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [terminationCost, setTerminationCost] = useState<{
    leaving_option: string;
    final_invoice_amount: number;
    days_to_pay_for: number;
    unpaid_invoices: any[];
    total_outstanding: number;
    can_request_leave: boolean;
  } | null>(null);
  const [costLoading, setCostLoading] = useState(false);

  // Accept Invitation
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchAgreements = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/agreements/history");
      setAgreements(res.data);
    } catch {
      setError("Failed to load your rental agreements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  const handleOpenLeaveDialog = async (agreement: Agreement) => {
    setLeaveTarget(agreement);
    setCostLoading(true);
    setLeaveError("");
    setTerminationCost(null);
    try {
      const res = await api.get(`/agreements/${agreement.id}/termination-cost`);
      setTerminationCost(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setLeaveError(Array.isArray(msg) ? msg[0] : msg || "Failed to load leave details.");
    } finally {
      setCostLoading(false);
    }
  };

  const handleRequestLeave = async () => {
    if (!leaveTarget) return;
    setLeaveSubmitting(true);
    setLeaveError("");
    try {
      await api.patch(`/agreements/${leaveTarget.id}/request-termination`);
      setLeaveTarget(null);
      await fetchAgreements();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setLeaveError(Array.isArray(msg) ? msg[0] : msg || "Failed to submit request.");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleAcceptInvitation = async (id: string) => {
    setAcceptingId(id);
    try {
      await api.patch(`/agreements/${id}/accept-invitation`);
      await fetchAgreements();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to accept lease invitation.");
    } finally {
      setAcceptingId(null);
    }
  };

  const pendingInvitations = agreements.filter(a => a.status === "DRAFT");
  const activeAgreement = agreements.find(a => a.status === "ACTIVE" || a.status === "TERMINATION_REQUESTED");
  const pastAgreements = agreements.filter(a => a.status !== "ACTIVE" && a.status !== "TERMINATION_REQUESTED" && a.status !== "DRAFT");

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Rental Agreements</h2>
        <p className="text-sm text-muted-foreground">View your active lease, billing terms, and accept new landlord invitations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchAgreements} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : agreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSignature className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-bold">No rental agreements yet</h3>
          <p className="text-sm text-muted-foreground">Your landlord will create a rental agreement for you when you're assigned to a room.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-blue-500 uppercase tracking-widest text-xs">Lease Invitations</h3>
              <div className="space-y-4">
                {pendingInvitations.map(invitation => (
                  <AgreementCard
                    key={invitation.id}
                    agreement={invitation}
                    onAccept={() => handleAcceptInvitation(invitation.id)}
                    accepting={acceptingId === invitation.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Agreement */}
          {activeAgreement && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-muted-foreground uppercase tracking-widest text-xs">Current Lease</h3>
              <AgreementCard
                agreement={activeAgreement}
                onRequestLeave={activeAgreement.status === "ACTIVE" ? () => handleOpenLeaveDialog(activeAgreement) : undefined}
              />
            </div>
          )}

          {/* Past Agreements */}
          {pastAgreements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-muted-foreground uppercase tracking-widest text-xs">Agreement History</h3>
              <div className="space-y-4">
                {pastAgreements.map(agr => (
                  <AgreementCard key={agr.id} agreement={agr} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request to Leave Dialog */}
      <Dialog open={leaveTarget !== null} onOpenChange={o => !o && setLeaveTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" /> Request to Leave
            </DialogTitle>
            <DialogDescription>
              This will notify your landlord that you wish to terminate your rental agreement at:
              <strong className="block mt-1 text-foreground">{leaveTarget?.property.name} — Room {leaveTarget?.room.room_number}</strong>
            </DialogDescription>
          </DialogHeader>

          {costLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {leaveError && (
            <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {leaveError}
            </div>
          )}

          {!costLoading && terminationCost && (
            <div className="space-y-4 my-2">
              {/* Unpaid / Outstanding check */}
              {!terminationCost.can_request_leave ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> Blocked: Unpaid Balances Exist
                    </p>
                    <p>You must pay all outstanding rent and utility bills before requesting to leave.</p>
                  </div>

                  <div className="border border-border rounded-sm overflow-hidden">
                    <div className="p-2.5 bg-accent/40 text-[10px] uppercase font-bold text-muted-foreground border-b flex justify-between">
                      <span>Invoice Date / Due</span>
                      <span>Amount</span>
                    </div>
                    <div className="divide-y divide-border max-h-[140px] overflow-y-auto">
                      {terminationCost.unpaid_invoices.map((inv: any) => (
                        <div key={inv.id} className="p-2.5 flex justify-between text-xs items-center hover:bg-accent/10">
                          <div>
                            <p className="font-semibold">Rent Invoice</p>
                            <p className="text-[10px] text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                          </div>
                          <span className="font-mono font-bold text-destructive">Rs {Number(inv.total_due).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-2.5 bg-destructive/5 text-xs font-bold text-right flex justify-between items-center border-t border-border">
                      <span className="text-muted-foreground">Total Outstanding:</span>
                      <span className="text-destructive font-mono font-black text-sm">Rs {Number(terminationCost.total_outstanding).toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-muted-foreground">
                    Please visit the Submit Payment page to settle these.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-sm bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                    ⚠️ Leaving Rule: {leavingOptionLabel[terminationCost.leaving_option]}
                  </div>

                  <div className="border border-border rounded-sm divide-y divide-border">
                    <div className="p-3 flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Days Stayed in Current Month:</span>
                      <span className="font-bold">{terminationCost.days_to_pay_for} days</span>
                    </div>
                    <div className="p-3 flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Stay Dates / Prorated Fee:</span>
                      <span className="font-mono font-bold text-emerald-500">Rs {Number(terminationCost.final_invoice_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Confirming this request will submit it to your landlord for review. Upon approval, a final invoice of <strong className="text-foreground">Rs {Number(terminationCost.final_invoice_amount).toFixed(2)}</strong> will be generated.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t">
            <button onClick={() => setLeaveTarget(null)} className="px-4 py-2 text-sm rounded-sm border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            {!costLoading && terminationCost?.can_request_leave && (
              <button
                onClick={handleRequestLeave}
                disabled={leaveSubmitting}
                className="px-4 py-2 text-sm font-bold rounded-sm bg-yellow-500 text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {leaveSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Leave Request
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function AgreementCard({
  agreement,
  onRequestLeave,
  onAccept,
  accepting
}: {
  agreement: Agreement;
  onRequestLeave?: () => void;
  onAccept?: () => void;
  accepting?: boolean;
}) {
  const status = statusConfig[agreement.status];
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all border border-border/80">
      <CardHeader className="pb-3 border-b border-border bg-accent/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{agreement.property.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{agreement.property.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-transparent ${status.class}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">
        {/* Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Room", value: `Room ${agreement.room?.room_number || "Pending"}`, icon: Home },
            { label: "Monthly Rent", value: `$${Number(agreement.rent_amount).toFixed(2)}`, icon: DollarSign },
            { label: "Collection Day", value: `${agreement.collection_day}th of Month`, icon: Calendar },
            { label: "Security Deposit", value: `$${Number(agreement.security_deposit).toFixed(2)}`, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Icon className="h-3 w-3" /> {label}
              </p>
              <p className="text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Lease Period</p>
            <p className="text-sm font-semibold">
              {new Date(agreement.start_date).toLocaleDateString()} — {new Date(agreement.end_date).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Landlord / Manager</p>
            <p className="text-sm font-semibold">
              {agreement.landlord?.company_name ||
                `${agreement.landlord?.user?.first_name || ""} ${agreement.landlord?.user?.last_name || ""}`}
            </p>
            <p className="text-xs text-muted-foreground">{agreement.landlord?.user?.phone || ""}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-accent/30 border border-border space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" /> Exit / Leaving Terms
          </p>
          <p className="text-sm font-medium">
            {leavingOptionLabel[agreement.leaving_option] || agreement.leaving_option}
          </p>
          {agreement.leaving_rule && (
            <p className="text-xs text-muted-foreground">Leaving Rule: {leavingOptionLabel[agreement.leaving_rule]}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Grace Period: {agreement.grace_period_days} days · Late Fee: Rs {Number(agreement.late_fee_flat).toFixed(2)}
          </p>
        </div>

        {/* Accept / Reject Buttons for DRAFT (Lease Invitations) */}
        {onAccept && (
          <div className="flex justify-end pt-2 gap-2">
            <button
              onClick={onAccept}
              disabled={accepting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Accept Invitation
            </button>
          </div>
        )}

        {/* Request to Leave Button */}
        {onRequestLeave && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onRequestLeave}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="h-4 w-4" /> Request to Leave
            </button>
          </div>
        )}

        {agreement.status === "TERMINATION_REQUESTED" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Your leave request has been submitted and is awaiting your landlord's review.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
