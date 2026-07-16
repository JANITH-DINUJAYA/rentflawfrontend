"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Plus, 
  FileSignature, 
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RentalAgreement {
  id: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  collectionDay: number;
  leavingOption: "PAY_STAY_DATES" | "PAY_FULL_MONTH" | "DECIDE_IN_AGREEMENT";
  leavingRule?: "PAY_STAY_DATES" | "PAY_FULL_MONTH";
  status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
}

export default function AgreementsPage() {
  const [agreements, setAgreements] = React.useState<RentalAgreement[]>([
    {
      id: "1",
      tenantName: "John Smith",
      propertyName: "Greenwood Residence",
      roomNumber: "101",
      rentAmount: 550,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      collectionDay: 5,
      leavingOption: "PAY_STAY_DATES",
      status: "ACTIVE"
    },
    {
      id: "2",
      tenantName: "Jane Doe",
      propertyName: "City Center Hostels",
      roomNumber: "204",
      rentAmount: 450,
      startDate: "2026-02-01",
      endDate: "2026-08-01",
      collectionDay: 1,
      leavingOption: "DECIDE_IN_AGREEMENT",
      leavingRule: "PAY_FULL_MONTH",
      status: "ACTIVE"
    },
    {
      id: "3",
      tenantName: "Bob Johnson",
      propertyName: "Greenwood Residence",
      roomNumber: "102",
      rentAmount: 500,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      collectionDay: 10,
      leavingOption: "PAY_FULL_MONTH",
      status: "TERMINATED"
    }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [tenantName, setTenantName] = React.useState("");
  const [propertyName, setPropertyName] = React.useState("Greenwood Residence");
  const [roomNumber, setRoomNumber] = React.useState("");
  const [rentAmount, setRentAmount] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [collectionDay, setCollectionDay] = React.useState("5");
  const [leavingOption, setLeavingOption] = React.useState<RentalAgreement["leavingOption"]>("PAY_STAY_DATES");
  const [leavingRule, setLeavingRule] = React.useState<"PAY_STAY_DATES" | "PAY_FULL_MONTH">("PAY_STAY_DATES");
  const [formError, setFormError] = React.useState("");

  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!tenantName.trim() || !roomNumber.trim() || !rentAmount.trim() || !startDate || !endDate) {
      setFormError("All fields are required");
      return;
    }

    const colDay = Number(collectionDay);
    if (colDay < 1 || colDay > 28) {
      setFormError("Collection day must be between 1 and 28");
      return;
    }

    const newAgreement: RentalAgreement = {
      id: String(agreements.length + 1),
      tenantName,
      propertyName,
      roomNumber,
      rentAmount: Number(rentAmount),
      startDate,
      endDate,
      collectionDay: colDay,
      leavingOption,
      leavingRule: leavingOption === "DECIDE_IN_AGREEMENT" ? leavingRule : undefined,
      status: "DRAFT"
    };

    setAgreements([newAgreement, ...agreements]);
    setDialogOpen(false);
    
    // reset form
    setTenantName("");
    setRoomNumber("");
    setRentAmount("");
    setStartDate("");
    setEndDate("");
    setCollectionDay("5");
    setLeavingOption("PAY_STAY_DATES");
  };

  const handleActivate = (id: string) => {
    setAgreements(agreements.map(a => a.id === id ? { ...a, status: "ACTIVE" } : a));
  };

  return (
    <DashboardLayout>
      {/* ─── Header Section ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lease Agreements</h2>
          <p className="text-sm text-muted-foreground">Draft, activate, and manage lease contracts, billing periods, and exit rules.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Draft Lease
        </button>
      </div>

      {/* ─── Agreements Table ──────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property / Room</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Lease Term</TableHead>
                <TableHead>Exit Option (Agreement Day)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((a) => (
                <TableRow key={a.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell className="font-bold">{a.tenantName}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{a.propertyName}</p>
                    <p className="text-xs text-muted-foreground">Room {a.roomNumber}</p>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${a.rentAmount}/mo
                    <p className="text-[10px] text-muted-foreground">Collection: Day {a.collectionDay}</p>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p>{a.startDate}</p>
                    <p className="text-muted-foreground">to {a.endDate}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] py-0.5 font-semibold">
                      {a.leavingOption.replace(/_/g, " ")}
                    </Badge>
                    {a.leavingOption === "DECIDE_IN_AGREEMENT" && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        Rule: {a.leavingRule?.replace(/_/g, " ")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">ACTIVE</Badge>
                    ) : a.status === "DRAFT" ? (
                      <Badge variant="secondary" className="font-bold">DRAFT</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none font-bold">TERMINATED</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "DRAFT" ? (
                      <button
                        onClick={() => handleActivate(a.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all duration-200"
                      >
                        Activate Lease
                      </button>
                    ) : (
                      <button className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all duration-150">
                        Terminate Lease
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Draft Agreement Dialog ─────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Draft New Lease Agreement</DialogTitle>
            <DialogDescription>
              Set up tenant details, rent variables, billing dates, and choose the exit termination rule.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAgreement} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tenantName">Tenant Full Name</Label>
                <Input
                  id="tenantName"
                  placeholder="e.g. John Doe"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="propertyName">Select Property</Label>
                <Select value={propertyName} onValueChange={(val) => val && setPropertyName(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greenwood Residence">Greenwood Residence</SelectItem>
                    <SelectItem value="City Center Hostels">City Center Hostels</SelectItem>
                    <SelectItem value="Suburban Shared House">Suburban Shared House</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g. 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rentAmount">Monthly Rent Amount ($)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  placeholder="e.g. 500"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Lease Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate">Lease End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collectionDay">Monthly Invoice Collection Day (1 - 28)</Label>
              <Input
                id="collectionDay"
                type="number"
                min="1"
                max="28"
                value={collectionDay}
                onChange={(e) => setCollectionDay(e.target.value)}
              />
            </div>

            {/* Leaving Option Selector */}
            <div className="space-y-1.5 border-t border-border pt-4">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                Leaving Option Rules
                <span title="Choose how the final partial month is calculated upon tenant exit.">
                  <HelpCircle className="h-4.5 w-4.5 text-muted-foreground" />
                </span>
              </Label>
              
              <Select 
                value={leavingOption} 
                onValueChange={(v) => v && setLeavingOption(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAY_STAY_DATES">Pay Stay Dates (Prorated daily rent)</SelectItem>
                  <SelectItem value="PAY_FULL_MONTH">Pay Full Month (Flat rate monthly rent)</SelectItem>
                  <SelectItem value="DECIDE_IN_AGREEMENT">Decide In Agreement (Set actual rule now)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* leaving_rule conditional field */}
            {leavingOption === "DECIDE_IN_AGREEMENT" && (
              <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5 animate-slide-in">
                <Label htmlFor="leavingRule">Select Actual Binding Rule</Label>
                <Select 
                  value={leavingRule} 
                  onValueChange={(v) => v && setLeavingRule(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAY_STAY_DATES">Prorated Daily Rent (Pay stay dates)</SelectItem>
                    <SelectItem value="PAY_FULL_MONTH">Flat Monthly Rent (Pay full month)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Since you selected "Decide In Agreement", you must pick the binding calculation rule that will apply automatically upon tenant exit.
                </p>
              </div>
            )}

            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
              >
                Draft Lease
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
