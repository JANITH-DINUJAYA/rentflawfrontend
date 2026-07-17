"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Zap, PlusCircle, Search, Droplets, Flame, Wifi, Trash2, Wind, ChevronDown, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

type UtilityType = "ELECTRICITY" | "WATER" | "GAS" | "INTERNET" | "WASTE" | "AC";

const UTILITY_META: Record<UtilityType, { label: string; icon: React.ElementType; color: string }> = {
  ELECTRICITY: { label: "Electricity", icon: Zap, color: "text-yellow-500 bg-yellow-500/10" },
  WATER: { label: "Water", icon: Droplets, color: "text-sky-500 bg-sky-500/10" },
  GAS: { label: "Gas", icon: Flame, color: "text-orange-500 bg-orange-500/10" },
  INTERNET: { label: "Internet", icon: Wifi, color: "text-violet-500 bg-violet-500/10" },
  WASTE: { label: "Waste", icon: Trash2, color: "text-stone-500 bg-stone-500/10" },
  AC: { label: "A/C", icon: Wind, color: "text-cyan-500 bg-cyan-500/10" }
};

const emptyForm = {
  invoice_id: "", type: "ELECTRICITY" as UtilityType,
  previousReading: "", currentReading: "", ratePerUnit: "", amount: ""
};

export default function UtilitiesPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(emptyForm);

  const fetchBills = async () => {
    setLoading(true);
    setError("");
    try {
      const [billsRes, invoicesRes] = await Promise.all([
        api.get("/utilities"),
        api.get("/invoices/landlord?status=PENDING"),
      ]);
      setBills(Array.isArray(billsRes.data) ? billsRes.data : []);
      // invoicesRes.data is { invoices, total, page, limit }
      setInvoices(Array.isArray(invoicesRes.data?.invoices) ? invoicesRes.data.invoices : []);
    } catch {
      setError("Failed to load utility bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const derivedAmount = useMemo(() => {
    const prev = parseFloat(form.previousReading);
    const curr = parseFloat(form.currentReading);
    const rate = parseFloat(form.ratePerUnit);
    if (!isNaN(prev) && !isNaN(curr) && !isNaN(rate)) {
      return ((curr - prev) * rate).toFixed(2);
    }
    return form.amount;
  }, [form.previousReading, form.currentReading, form.ratePerUnit, form.amount]);

  const handleAdd = async () => {
    if (!form.invoice_id) {
      setFormError("Please select an invoice.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const body: any = {
        invoice_id: form.invoice_id,
        type: form.type,
      };
      if (form.previousReading) body.meter_reading_previous = parseFloat(form.previousReading);
      if (form.currentReading) body.meter_reading_current = parseFloat(form.currentReading);
      if (form.ratePerUnit) body.rate_per_unit = parseFloat(form.ratePerUnit);
      if (form.amount) body.amount = parseFloat(form.amount);

      await api.post("/utilities", body);
      setShowAdd(false);
      setForm(emptyForm);
      await fetchBills();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to save utility charge.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = bills.filter(b => {
    const tenantName = b.invoice?.agreement?.tenant
      ? `${b.invoice.agreement.tenant.first_name} ${b.invoice.agreement.tenant.last_name}`
      : "";
    const matchType = typeFilter === "ALL" || b.type === typeFilter;
    const matchSearch = tenantName.toLowerCase().includes(search.toLowerCase()) ||
      (b.invoice_id || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalAmount = filtered.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utility Bills</h2>
          <p className="text-sm text-muted-foreground">Attach utility charges to invoices. Meter readings auto-calculate the billable amount.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError(""); setForm(emptyForm); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95 cursor-pointer"
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
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${typeFilter === type ? "border-primary bg-primary/5 scale-105 shadow-md" : "border-border bg-card hover:bg-accent/30"}`}
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
        <div className="ml-auto flex items-center gap-3">
          <button onClick={fetchBills} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">
            Total shown: <span className="text-foreground font-bold">${totalAmount.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchBills} className="text-primary hover:underline text-xs cursor-pointer">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
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
                  const meta = UTILITY_META[b.type as UtilityType] || UTILITY_META.ELECTRICITY;
                  const Icon = meta.icon;
                  const isOpen = expandedRow === b.id;
                  const tenantName = b.invoice?.agreement?.tenant
                    ? `${b.invoice.agreement.tenant.first_name} ${b.invoice.agreement.tenant.last_name}`
                    : "—";
                  const propertyName = b.invoice?.agreement?.property?.name || "—";
                  const roomNumber = b.invoice?.agreement?.room?.room_number || "—";
                  const billingDate = b.created_at ? new Date(b.created_at).toLocaleDateString() : "—";
                  return (
                    <React.Fragment key={b.id}>
                      <TableRow className="hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => setExpandedRow(isOpen ? null : b.id)}>
                        <TableCell>
                          <Badge variant="outline" className={`${meta.color} border-none font-bold`}>
                            <Icon className="mr-1 h-3 w-3" /> {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{tenantName}</p>
                          <p className="text-xs text-muted-foreground">{propertyName} · Rm {roomNumber}</p>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{b.invoice_id?.slice(0, 8)}...</TableCell>
                        <TableCell className="font-bold">${Number(b.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{billingDate}</TableCell>
                        <TableCell className="text-right">
                          <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-accent/10">
                          <TableCell colSpan={6} className="px-6 py-4">
                            {b.meter_reading_previous !== null ? (
                              <div className="flex flex-wrap gap-6 text-sm">
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Previous Reading</p>
                                  <p className="font-semibold">{b.meter_reading_previous} units</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Current Reading</p>
                                  <p className="font-semibold">{b.meter_reading_current} units</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Consumption</p>
                                  <p className="font-semibold">{Number(b.meter_reading_current) - Number(b.meter_reading_previous)} units</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Rate/Unit</p>
                                  <p className="font-semibold">${Number(b.rate_per_unit).toFixed(3)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Calculated Amount</p>
                                  <p className="font-bold text-primary">${Number(b.amount).toFixed(2)}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Flat charge: <span className="font-bold text-foreground">${Number(b.amount).toFixed(2)}</span></p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No utility bills found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Utility Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Utility Charge</DialogTitle>
            <DialogDescription>Link a utility cost to an invoice. Meter readings auto-calculate the amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Select Invoice</Label>
                <Select value={form.invoice_id} onValueChange={v => v && setForm({ ...form, invoice_id: v })}>
                  <SelectTrigger>
                    {form.invoice_id
                      ? <span className="flex flex-1 text-left truncate">{(() => { const inv = invoices.find(i => i.id === form.invoice_id); if (!inv) return form.invoice_id; const tenant = inv.agreement?.tenant; const name = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unknown"; const due = new Date(inv.due_date).toLocaleDateString(); return `${name} — $${Number(inv.total_due).toFixed(2)} (Due: ${due})`; })()}</span>
                      : <SelectValue placeholder="Choose pending invoice" />}
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.length === 0 ? (
                      <SelectItem value="_none" disabled>No pending invoices found</SelectItem>
                    ) : invoices.map(inv => {
                      const tenant = inv.agreement?.tenant;
                      const name = tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unknown";
                      const due = new Date(inv.due_date).toLocaleDateString();
                      return (
                        <SelectItem key={inv.id} value={inv.id}>{`${name} — $${Number(inv.total_due).toFixed(2)} (Due: ${due})`}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="utlType">Utility Type</Label>
                <Select value={form.type} onValueChange={v => v !== null && setForm({ ...form, type: v as UtilityType })}>
                  <SelectTrigger id="utlType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UTILITY_META) as UtilityType[]).map(t => (
                      <SelectItem key={t} value={t}>{`${UTILITY_META[t].label}`}</SelectItem>
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
              disabled={saving}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Utility Charge
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
