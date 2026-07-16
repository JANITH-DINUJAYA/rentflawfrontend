"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileSignature, Calendar, Building2, Home, User, DollarSign, Clock,
  AlertTriangle, Loader2, AlertCircle, CheckCircle2, LogOut
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
  DRAFT: { label: "Draft", class: "bg-gray-500/10 text-gray-500", icon: Clock },
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

  const activeAgreement = agreements.find(a => a.status === "ACTIVE" || a.status === "TERMINATION_REQUESTED");
  const pastAgreements = agreements.filter(a => a.status !== "ACTIVE" && a.status !== "TERMINATION_REQUESTED");

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Rental Agreements</h2>
        <p className="text-sm text-muted-foreground">View your active lease, billing terms, and exit conditions.</p>
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
          {/* Active Agreement */}
          {activeAgreement && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-muted-foreground uppercase tracking-widest text-xs">Current Lease</h3>
              <AgreementCard
                agreement={activeAgreement}
                onRequestLeave={activeAgreement.status === "ACTIVE" ? () => setLeaveTarget(activeAgreement) : undefined}
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" /> Request to Leave
            </DialogTitle>
            <DialogDescription>
              This will notify your landlord that you wish to terminate your rental agreement at:
              <strong className="block mt-1">{leaveTarget?.property.name} — Room {leaveTarget?.room.room_number}</strong>
              Your landlord must accept the request before the agreement is officially terminated.
            </DialogDescription>
          </DialogHeader>
          {leaveError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {leaveError}
            </div>
          )}
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400 font-medium">
            ⚠️ Leaving Rule: {leaveTarget?.leaving_option ? leavingOptionLabel[leaveTarget.leaving_option] : "—"}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setLeaveTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button
              onClick={handleRequestLeave}
              disabled={leaveSubmitting}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-yellow-500 text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {leaveSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Request to Leave
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function AgreementCard({ agreement, onRequestLeave }: { agreement: Agreement; onRequestLeave?: () => void }) {
  const status = statusConfig[agreement.status];
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
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
            { label: "Room", value: `Room ${agreement.room.room_number}`, icon: Home },
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
              {agreement.landlord.company_name ||
                `${agreement.landlord.user.first_name} ${agreement.landlord.user.last_name}`}
            </p>
            <p className="text-xs text-muted-foreground">{agreement.landlord.user.phone}</p>
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
            Grace Period: {agreement.grace_period_days} days · Late Fee: ${Number(agreement.late_fee_flat).toFixed(2)}
          </p>
        </div>

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


