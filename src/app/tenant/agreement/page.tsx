"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Calendar, Building2, Home, User, Info, DollarSign, Clock } from "lucide-react";

interface AgreementDetail {
  id: string;
  landlordName: string;
  landlordEmail: string;
  propertyName: string;
  roomNumber: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  collectionDay: number;
  leavingOption: "PAY_STAY_DATES" | "PAY_FULL_MONTH" | "DECIDE_IN_AGREEMENT";
  leavingRuleText: string;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
}

const SAMPLE_AGREEMENT: AgreementDetail = {
  id: "AGR-109283",
  landlordName: "Greenwood Rentals",
  landlordEmail: "info@greenwoodrent.com",
  propertyName: "Greenwood Residence",
  roomNumber: "102",
  rentAmount: 450,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  collectionDay: 20,
  leavingOption: "PAY_STAY_DATES",
  leavingRuleText: "Pay Stay Dates (Prorated daily rent for exit month based on actual stay duration)",
  status: "ACTIVE"
};

export default function TenantAgreementPage() {
  const agr = SAMPLE_AGREEMENT;

  return (
    <DashboardLayout>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Rental Lease Agreement</h2>
        <p className="text-sm text-muted-foreground">Review your active lease contract details, billing periods, and exit conditions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Lease Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Agreement Reference: {agr.id}
              </CardTitle>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                {agr.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {/* Rent & Term info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Monthly Rent</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-foreground">${agr.rentAmount}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Monthly Collection Day</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">{agr.collectionDay}th</span>
                  <span className="text-xs text-muted-foreground">of every month</span>
                </div>
              </div>
            </div>

            {/* Property / Room details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Location Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-accent/10">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Property</p>
                    <p className="font-semibold text-sm">{agr.propertyName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-accent/10">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Room / Unit</p>
                    <p className="font-semibold text-sm">Room {agr.roomNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement Terms Dates */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Lease Term Duration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</p>
                    <p className="font-semibold text-sm">{agr.startDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">End Date</p>
                    <p className="font-semibold text-sm">{agr.endDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules & Landlord Information */}
        <div className="space-y-6">
          {/* Landlord Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Landlord Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <p className="font-bold text-foreground">{agr.landlordName}</p>
                <p className="text-muted-foreground">{agr.landlordEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Exit Calculations Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Exit Calculation Rule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3.5 rounded-xl border border-border bg-accent/15 text-foreground space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Clock className="h-4 w-4" />
                  <span>Exit Month Calculation Option</span>
                </div>
                <p className="text-xs">{agr.leavingRuleText}</p>
              </div>
              <p>
                This rule defines how billing is handled if you exit midway through a billing month. Prorating ensures you only pay for stay dates rather than a full flat rate month.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
