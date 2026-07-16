"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Zap,
  PlusCircle,
  Search,
  Droplets,
  Flame,
  Wifi,
  Trash2,
  Wind,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UtilityType = "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "WASTE" | "AC";

interface UtilityBill {
  id: string;
  invoiceId: string;
  tenantName: string;
  roomNumber: string;
  type: UtilityType;
  previousReading?: number;
  currentReading?: number;
  ratePerUnit?: number;
  amount: number;
  billingDate: string;
  propertyName: string;
}

const UTILITY_META: Record<UtilityType, { label: string; icon: React.ElementType; color: string }> = {
  ELECTRICITY: { label: "Electricity", icon: Zap, color: "text-yellow-500 bg-yellow-500/10" },
  WATER: { label: "Water", icon: Droplets, color: "text-sky-500 bg-sky-500/10" },
  GAS: { label: "Gas", icon: Flame, color: "text-orange-500 bg-orange-500/10" },
  INTERNET: { label: "Internet", icon: Wifi, color: "text-violet-500 bg-violet-500/10" },
  WASTE: { label: "Waste", icon: Trash2, color: "text-stone-500 bg-stone-500/10" },
  AC: { label: "A/C", icon: Wind, color: "text-cyan-500 bg-cyan-500/10" }
};

const SAMPLE: UtilityBill[] = [
  { id: "UTL-001", invoiceId: "INV-001", tenantName: "Alice Vance", roomNumber: "102", type: "ELECTRICITY", previousReading: 2100, currentReading: 2290, ratePerUnit: 0.28, amount: 53.2, billingDate: "2026-07-01", propertyName: "Greenwood Residence" },
  { id: "UTL-002", invoiceId: "INV-001", tenantName: "Alice Vance", roomNumber: "102", type: "WATER", amount: 12, billingDate: "2026-07-01", propertyName: "Greenwood Residence" },
  { id: "UTL-003", invoiceId: "INV-002", tenantName: "Marcus Brody", roomNumber: "205", type: "ELECTRICITY", previousReading: 870, currentReading: 1020, ratePerUnit: 0.28, amount: 42, billingDate: "2026-07-01", propertyName: "City Center Hostels" },
  { id: "UTL-004", invoiceId: "INV-002", tenantName: "Marcus Brody", roomNumber: "205", type: "INTERNET", amount: 25, billingDate: "2026-07-01", propertyName: "City Center Hostels" }
];

export default function UtilitiesPage() {
  const [bills, setBills] = React.useState<UtilityBill[]>(SAMPLE);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [showAdd, setShowAdd] = React.useState(false);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  // Form state
  const [form, setForm] = React.useState({
    invoiceId: "", type: "ELECTRICITY" as UtilityType,
    previousReading: "", currentReading: "", ratePerUnit: "", amount: ""
  });

  const derivedAmount = React.useMemo(() => {
    const prev = parseFloat(form.previousReading);
    const curr = parseFloat(form.currentReading);
    const rate = parseFloat(form.ratePerUnit);
    if (!isNaN(prev) && !isNaN(curr) && !isNaN(rate)) {
      return ((curr - prev) * rate).toFixed(2);
    }
    return form.amount;
  }, [form.previousReading, form.currentReading, form.ratePerUnit, form.amount]);

  const handleAdd = () => {
    const newBill: UtilityBill = {
      id: `UTL-${String(bills.length + 1).padStart(3, "0")}`,
      invoiceId: form.invoiceId || "INV-NEW",
      tenantName: "New Tenant",
      roomNumber: "—",
      type: form.type,
      previousReading: parseFloat(form.previousReading) || undefined,
      currentReading: parseFloat(form.currentReading) || undefined,
      ratePerUnit: parseFloat(form.ratePerUnit) || undefined,
      amount: parseFloat(derivedAmount) || parseFloat(form.amount) || 0,
      billingDate: new Date().toISOString().slice(0, 10),
      propertyName: "—"
    };
    setBills([newBill, ...bills]);
    setShowAdd(false);
    setForm({ invoiceId: "", type: "ELECTRICITY", previousReading: "", currentReading: "", ratePerUnit: "", amount: "" });
  };

  const filtered = bills.filter(b => {
    const matchType = typeFilter === "ALL" || b.type === typeFilter;
    const matchSearch = b.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      b.invoiceId.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalAmount = filtered.reduce((s, b) => s + b.amount, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utility Bills</h2>
          <p className="text-sm text-muted-foreground">Attach utility charges to invoices. Meter readings auto-calculate the billable amount.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Add Utility Charge
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {(Object.keys(UTILITY_META) as UtilityType[]).map(type => {
          const meta = UTILITY_META[type];
          const Icon = meta.icon;
          const count = bills.filter(b => b.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(prev => prev === type ? "ALL" : type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${typeFilter === type ? "border-primary bg-primary/5 scale-105 shadow-md" : "border-border bg-card hover:bg-accent/30"}`}
            >
              <div className={`p-2 rounded-lg ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold">{count}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by tenant or invoice..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto text-sm font-semibold text-muted-foreground">
          Total shown: <span className="text-foreground font-bold">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => {
                const meta = UTILITY_META[b.type];
                const Icon = meta.icon;
                const isOpen = expandedRow === b.id;
                return (
                  <React.Fragment key={b.id}>
                    <TableRow className="hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => setExpandedRow(isOpen ? null : b.id)}>
                      <TableCell className="font-mono text-xs font-bold">{b.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${meta.color} border-none font-bold`}>
                          <Icon className="mr-1 h-3 w-3" /> {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{b.tenantName}</p>
                        <p className="text-xs text-muted-foreground">{b.propertyName} · Rm {b.roomNumber}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.invoiceId}</TableCell>
                      <TableCell className="font-bold">${b.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.billingDate}</TableCell>
                      <TableCell className="text-right">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="bg-accent/10">
                        <TableCell colSpan={7} className="px-6 py-4">
                          {b.previousReading !== undefined ? (
                            <div className="flex flex-wrap gap-6 text-sm">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Previous Reading</p>
                                <p className="font-semibold">{b.previousReading} units</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Current Reading</p>
                                <p className="font-semibold">{b.currentReading} units</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Consumption</p>
                                <p className="font-semibold">{(b.currentReading! - b.previousReading)} units</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Rate/Unit</p>
                                <p className="font-semibold">${b.ratePerUnit}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Calculated Amount</p>
                                <p className="font-bold text-primary">${b.amount.toFixed(2)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Flat charge: <span className="font-bold text-foreground">${b.amount.toFixed(2)}</span></p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No utility bills found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Utility Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Utility Charge</DialogTitle>
            <DialogDescription>Link a utility cost to an invoice. Meter readings auto-calculate the amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invoiceId">Invoice ID</Label>
                <Input id="invoiceId" placeholder="INV-001" value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utlType">Utility Type</Label>
                <Select value={form.type} onValueChange={v => v !== null && setForm({ ...form, type: v as UtilityType })}>
                  <SelectTrigger id="utlType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UTILITY_META) as UtilityType[]).map(t => (
                      <SelectItem key={t} value={t}>{UTILITY_META[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prevReading">Previous Reading</Label>
                <Input id="prevReading" type="number" placeholder="0" value={form.previousReading} onChange={e => setForm({ ...form, previousReading: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currReading">Current Reading</Label>
                <Input id="currReading" type="number" placeholder="0" value={form.currentReading} onChange={e => setForm({ ...form, currentReading: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rateUnit">Rate/Unit</Label>
                <Input id="rateUnit" type="number" step="0.01" placeholder="0.28" value={form.ratePerUnit} onChange={e => setForm({ ...form, ratePerUnit: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utlAmount">
                Amount {derivedAmount && derivedAmount !== form.amount ? <span className="text-primary font-bold">(Calculated: ${derivedAmount})</span> : "(or enter flat charge)"}
              </Label>
              <Input id="utlAmount" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200"
            >
              Save Utility Charge
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
