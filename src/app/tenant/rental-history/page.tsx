"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { FileSignature, Calendar, Building2, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface PastAgreement {
  id: string;
  rent_amount: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  status: string;
  property: {
    name: string;
    address: string;
    type: string;
  };
  room: {
    room_number: string;
  };
  landlord: {
    company_name: string | null;
    user: {
      first_name: string;
      last_name: string;
      phone: string;
    };
  };
  deposit_refund?: {
    id: string;
    refund_amount: number;
    deductions: number;
    reason: string | null;
    is_paid: boolean;
    processed_at: string;
    created_at: string;
  } | null;
}

export default function TenantRentalHistoryPage() {
  const [agreements, setAgreements] = useState<PastAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/agreements/history");
      setAgreements(res.data);
    } catch {
      setError("Failed to load rental history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Portable Rental History</h2>
          <p className="text-sm text-muted-foreground">
            View all active and past tenancies across landlords on the RentFlaw network.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-sm border border-border hover:bg-accent/50 cursor-pointer flex items-center justify-center"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchHistory} className="text-primary hover:underline text-xs">
            Retry
          </button>
        </div>
      ) : agreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed rounded-sm">
          <div className="h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-bold">No rental history found</h3>
          <p className="text-sm text-muted-foreground">
            Any active or terminated rental agreements will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {agreements.map((agr) => {
            return (
              <Card key={agr.id} className="hover:shadow-md transition-all border border-border">
                <CardHeader className="pb-3 border-b border-border bg-accent/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{agr.property.name}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {agr.property.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`font-bold text-[10px] uppercase border-none py-1 px-2.5 ${
                          agr.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : agr.status === "TERMINATED"
                            ? "bg-red-500/10 text-red-500"
                            : agr.status === "TERMINATION_REQUESTED"
                            ? "bg-yellow-500/10 text-yellow-600"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {agr.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground uppercase font-semibold">Room</p>
                      <p className="font-bold text-sm mt-0.5">Room {agr.room?.room_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase font-semibold">Period</p>
                      <p className="font-bold mt-0.5">
                        {new Date(agr.start_date).toLocaleDateString()} &ndash;{" "}
                        {new Date(agr.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase font-semibold">Monthly Rent</p>
                      <p className="font-bold mt-0.5">${Number(agr.rent_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase font-semibold">Deposit Paid</p>
                      <p className="font-bold mt-0.5">${Number(agr.security_deposit).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Landlord Info */}
                  <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between text-xs text-muted-foreground gap-2">
                    <div>
                      Landlord: <strong className="text-foreground">{agr.landlord.company_name || `${agr.landlord.user.first_name} ${agr.landlord.user.last_name}`}</strong>
                    </div>
                    <div>
                      Contact: <span className="text-foreground font-semibold">{agr.landlord.user.phone}</span>
                    </div>
                  </div>

                  {/* Deposit Refund Trail */}
                  {agr.deposit_refund && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl mt-2 text-xs space-y-2">
                      <p className="font-bold text-primary flex items-center gap-1.5">
                        <FileSignature className="h-4 w-4" /> Security Deposit Settlement
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-muted-foreground">Status:</p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold mt-0.5 border-none uppercase ${
                              agr.deposit_refund.is_paid
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-yellow-500/10 text-yellow-600"
                            }`}
                          >
                            {agr.deposit_refund.is_paid ? "Paid" : "Settle Pending"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Refunded Amount:</p>
                          <p className="font-bold text-emerald-500 font-mono mt-0.5">
                            ${Number(agr.deposit_refund.refund_amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deductions:</p>
                          <p className="font-bold text-destructive font-mono mt-0.5">
                            ${Number(agr.deposit_refund.deductions).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {agr.deposit_refund.reason && (
                        <p className="text-[11px] text-muted-foreground italic border-t pt-1.5 mt-1.5">
                          Deduction Reason: {agr.deposit_refund.reason}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
