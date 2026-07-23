"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Users, PlusCircle, Search, Mail, Phone, Building, CheckCircle, Clock, XCircle, AlertCircle, Loader2, Check, Printer, Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableExportControls } from "@/components/table-export-controls";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type TenantStatus = "ACTIVE" | "INVITED" | "ENDED";

interface TenantRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenantCode: string;
  propertyName: string;
  roomNumber: string;
  status: TenantStatus;
  agreementId?: string;
  rentAmount?: number;
}

const emptyInviteForm = {
  tenantCode: "",
  propertyId: "",
  roomId: "",
  rentAmount: "",
  securityDeposit: "",
  startDate: "",
  endDate: "",
  collectionDay: "1",
  gracePeriodDays: "3",
  lateFeeFlat: "0",
  leavingOption: "PAY_STAY_DATES",
  leavingRule: ""
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Invite Dialog State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [verifiedTenant, setVerifiedTenant] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Lists for selection
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantsRes, agreementsRes, propertiesRes, roomsRes] = await Promise.all([
        api.get("/tenants/my-tenants"),
        api.get("/agreements"),
        api.get("/properties"),
        api.get("/rooms"),
      ]);

      setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);

      const list: TenantRecord[] = [];
      const seenIds = new Set<string>();

      // 1. Add Active tenants
      if (Array.isArray(tenantsRes.data)) {
        tenantsRes.data.forEach((t: any) => {
          const activeAgreement = t.rental_agreements?.find((a: any) => a.status === "ACTIVE");
          list.push({
            id: t.id,
            name: `${t.first_name} ${t.last_name}`,
            email: t.email,
            phone: t.phone || "—",
            tenantCode: t.tenant_code || "—",
            propertyName: activeAgreement?.property?.name || "No Property",
            roomNumber: activeAgreement?.room?.room_number || "—",
            status: "ACTIVE",
            agreementId: activeAgreement?.id,
            rentAmount: activeAgreement ? Number(activeAgreement.rent_amount) : undefined
          });
          seenIds.add(t.id);
        });
      }

      // 2. Add Invited tenants (Draft agreements) and Ended tenants
      if (Array.isArray(agreementsRes.data)) {
        agreementsRes.data.forEach((agr: any) => {
          if (agr.status === "DRAFT") {
            list.push({
              id: agr.tenant?.id || agr.id,
              name: agr.tenant ? `${agr.tenant.first_name} ${agr.tenant.last_name}` : "Invited Tenant",
              email: agr.tenant?.email || "—",
              phone: agr.tenant?.phone || "—",
              tenantCode: agr.tenant?.tenant_code || "—",
              propertyName: agr.property?.name || "—",
              roomNumber: agr.room?.room_number || "—",
              status: "INVITED",
              agreementId: agr.id,
              rentAmount: Number(agr.rent_amount)
            });
          } else if (agr.status === "TERMINATED" || agr.status === "EXPIRED") {
            // Only add ended if they are not already seen in active list
            if (agr.tenant && !seenIds.has(agr.tenant.id)) {
              list.push({
                id: agr.tenant.id,
                name: `${agr.tenant.first_name} ${agr.tenant.last_name}`,
                email: agr.tenant.email,
                phone: agr.tenant.phone || "—",
                tenantCode: agr.tenant.tenant_code || "—",
                propertyName: agr.property?.name || "—",
                roomNumber: agr.room?.room_number || "—",
                status: "ENDED",
                agreementId: agr.id,
                rentAmount: Number(agr.rent_amount)
              });
            }
          }
        });
      }

      setTenants(list);
    } catch {
      setError("Failed to load tenant and property listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tenant? Deactivating them will send them to the trash bin.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/tenants/${id}`);
      fetchTenants(); // Re-fetch list
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete tenant.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrintTenant = (t: any) => {
    const rentAmountStr = t.rentAmount !== undefined ? `Rs ${Number(t.rentAmount).toFixed(2)}` : "—";
    const statusLabel = t.status === "ACTIVE" ? "Active" : t.status === "INVITED" ? "Invited" : "Ended";
    const html = `
      <html>
        <head>
          <title>Tenant Profile - ${t.name}</title>
          <style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;padding:40px;margin:0}
            .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:15px;margin-bottom:25px}
            .brand{font-size:22px;font-weight:900;color:#4f46e5}
            .brand span{font-size:12px;font-weight:500;color:#6b7280;display:block;margin-top:2px}
            .badge{padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;}
            h2{font-size:15px;font-weight:700;color:#4f46e5;margin:20px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:8px}
            .field label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}
            .field p{font-size:13px;color:#111827;font-weight:600;margin-top:2px}
            .footer{margin-top:50px;padding-top:15px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}
            @media print{body{padding:20px}}
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">RentFlaw<span>Tenant Account Profile</span></div>
            <div class="badge" style="background:${t.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6'};color:${t.status === 'ACTIVE' ? '#059669' : '#6b7280'}">${statusLabel}</div>
          </div>
          <h2>Personal Details</h2>
          <div class="grid">
            <div class="field"><label>Full Name</label><p>${t.name}</p></div>
            <div class="field"><label>Email Address</label><p>${t.email}</p></div>
            <div class="field"><label>Phone Number</label><p>${t.phone || '—'}</p></div>
            <div class="field"><label>Tenant Share Code</label><p>${t.tenantCode || '—'}</p></div>
          </div>
          <h2>Lease & Occupancy Information</h2>
          <div class="grid">
            <div class="field"><label>Assigned Property</label><p>${t.propertyName || 'No Property Assigned'}</p></div>
            <div class="field"><label>Room / Unit Number</label><p>${t.roomNumber || '—'}</p></div>
            <div class="field"><label>Current Monthly Rent</label><p>${rentAmountStr}</p></div>
          </div>
          <div class="footer">RentFlaw &mdash; Global Rental Management SaaS &nbsp;&bull;&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
          <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}<\/script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) { alert("Popup blocked — please allow popups for this site."); return; }
    w.document.write(html);
    w.document.close();
  };

  const handleVerifyTenant = async () => {
    if (!inviteForm.tenantCode.trim()) {
      setVerifyError("Please enter a tenant code.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    setVerifiedTenant(null);
    try {
      const res = await api.get(`/users/search/tenant/${inviteForm.tenantCode.trim().toUpperCase()}`);
      if (!res.data) {
        setVerifyError("Tenant code not found. Make sure the tenant is registered.");
      } else {
        setVerifiedTenant(res.data);
      }
    } catch (err: any) {
      setVerifyError(err?.response?.data?.message || "Invalid tenant code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedTenant || !inviteForm.propertyId || !inviteForm.roomId || !inviteForm.rentAmount || !inviteForm.startDate || !inviteForm.endDate) {
      setInviteError("Please fill all required lease settings.");
      return;
    }

    setInviteSaving(true);
    setInviteError("");
    try {
      await api.post("/agreements", {
        tenant_id: verifiedTenant.id,
        property_id: inviteForm.propertyId,
        room_id: inviteForm.roomId,
        rent_amount: parseFloat(inviteForm.rentAmount),
        security_deposit: parseFloat(inviteForm.securityDeposit || inviteForm.rentAmount),
        start_date: new Date(inviteForm.startDate),
        end_date: new Date(inviteForm.endDate),
        collection_day: parseInt(inviteForm.collectionDay),
        grace_period_days: parseInt(inviteForm.gracePeriodDays),
        late_fee_flat: parseFloat(inviteForm.lateFeeFlat || "0"),
        leaving_option: inviteForm.leavingOption,
        leaving_rule: undefined
      });

      setShowInvite(false);
      setInviteForm(emptyInviteForm);
      setVerifiedTenant(null);
      await fetchTenants();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setInviteError(Array.isArray(msg) ? msg[0] : msg || "Failed to create lease invitation.");
    } finally {
      setInviteSaving(false);
    }
  };

  const handlePropertyChange = (propertyId: string | null) => {
    setInviteForm(f => ({ ...f, propertyId: propertyId || "", roomId: "" }));
  };

  const handleRoomChange = (roomId: string | null) => {
    if (!roomId) return;
    const r = rooms.find(room => room.id === roomId);
    setInviteForm(f => ({
      ...f,
      roomId,
      rentAmount: r ? String(r.base_rent) : "",
      securityDeposit: r ? String(r.base_rent) : ""
    }));
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.tenantCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableRooms = rooms.filter(r => r.floor?.property_id === inviteForm.propertyId);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants Directory</h2>
          <p className="text-sm text-muted-foreground">Manage active tenants, send invites to new occupants, and review lease links.</p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteError(""); setVerifyError(""); setVerifiedTenant(null); setInviteForm(emptyInviteForm); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Invite Tenant
        </button>
      </div>

      {/* Table Export Controls */}
      <div className="mt-6">
        <TableExportControls
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tenants by name, email or code..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="All Statuses"
          filterOptions={[
            { label: "Active", value: "ACTIVE" },
            { label: "Invited", value: "INVITED" },
            { label: "Ended", value: "ENDED" },
          ]}
          tableData={filtered.map(t => ({
            name: t.name,
            email: t.email,
            phone: t.phone,
            tenant_code: t.tenantCode,
            property: t.propertyName || "N/A",
            room: t.roomNumber || "N/A",
            status: t.status,
          }))}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "tenant_code", label: "Tenant Code" },
            { key: "property", label: "Property" },
            { key: "room", label: "Room" },
            { key: "status", label: "Status" },
          ]}
          filename="tenants_report"
          title="Tenants Directory Report"
        />
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchTenants} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Property & Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                      No tenants found matching these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {tenant.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{tenant.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">Code: {tenant.tenantCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" /> {tenant.email}
                          </p>
                          {tenant.phone !== "—" && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" /> {tenant.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-semibold text-foreground">{tenant.propertyName}</p>
                          <p className="text-muted-foreground">Room {tenant.roomNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.status === "ACTIVE" ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px] flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" /> Active
                          </Badge>
                        ) : tenant.status === "INVITED" ? (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold text-[9px] flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" /> Invited
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-none font-bold text-[9px] flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" /> Ended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {tenant.rentAmount !== undefined ? `Rs ${tenant.rentAmount.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            disabled={deletingId === tenant.id}
                            className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                            title="Delete Tenant"
                          >
                            {deletingId === tenant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handlePrintTenant(tenant)}
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="Print Profile"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Tenant Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Invite New Tenant</DialogTitle>
            <DialogDescription>Assign a tenant to a room and configure their lease billing options.</DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          {/* STEP 1: Verify tenant code */}
          <div className="space-y-4 pt-2">
            <div className="flex gap-2 items-end">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="t-code">Tenant Verification Code</Label>
                <Input
                  id="t-code"
                  placeholder="e.g. T-AVA-001"
                  value={inviteForm.tenantCode}
                  onChange={e => setInviteForm({ ...inviteForm, tenantCode: e.target.value })}
                  disabled={verifiedTenant !== null}
                />
              </div>
              {verifiedTenant ? (
                <button
                  type="button"
                  onClick={() => { setVerifiedTenant(null); setInviteForm({ ...inviteForm, tenantCode: "" }); }}
                  className="px-3 h-8 text-xs font-bold rounded-lg border border-border hover:bg-accent/40 cursor-pointer"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyTenant}
                  disabled={verifying}
                  className="px-4 h-8 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {verifying && <Loader2 className="h-3 w-3 animate-spin" />}
                  Verify
                </button>
              )}
            </div>

            {verifyError && <p className="text-[11px] text-destructive font-medium">{verifyError}</p>}

            {verifiedTenant && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <Check className="h-4 w-4" />
                <span>Verified: {verifiedTenant.first_name} {verifiedTenant.last_name} ({verifiedTenant.email})</span>
              </div>
            )}

            {/* STEP 2: Configure Lease (Visible only after verification) */}
            {verifiedTenant && (
              <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2 border-t border-border">
                {/* Property selector */}
                <div className="space-y-1.5">
                  <Label>Assign Property</Label>
                  <Select value={inviteForm.propertyId} onValueChange={handlePropertyChange}>
                    <SelectTrigger className="w-full">
                      {inviteForm.propertyId
                        ? <span className="flex flex-1 text-left truncate">{properties.find(p => p.id === inviteForm.propertyId)?.name ?? inviteForm.propertyId}</span>
                        : <SelectValue placeholder="Choose property" />}
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{`${p.name}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room selector */}
                <div className="space-y-1.5">
                  <Label>Select Room</Label>
                  <Select value={inviteForm.roomId} onValueChange={handleRoomChange} disabled={!inviteForm.propertyId}>
                    <SelectTrigger className="w-full">
                      {inviteForm.roomId
                        ? <span className="flex flex-1 text-left truncate">{(() => { const r = availableRooms.find(r => r.id === inviteForm.roomId); return r ? `Room ${r.room_number} (${r.occupancy_type}) - Rs ${Number(r.base_rent).toFixed(2)}` : inviteForm.roomId; })()}</span>
                        : <SelectValue placeholder="Choose room" />}
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.length === 0 ? (
                        <SelectItem value="_none" disabled>No rooms on this property</SelectItem>
                      ) : (
                        availableRooms.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {`Room ${r.room_number} (${r.occupancy_type}) - Rs ${Number(r.base_rent).toFixed(2)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rentAmt">Monthly Rent (Rs)</Label>
                    <Input
                      id="rentAmt"
                      type="number"
                      placeholder="0.00"
                      value={inviteForm.rentAmount}
                      onChange={e => setInviteForm({ ...inviteForm, rentAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="depositAmt">Security Deposit (Rs)</Label>
                    <Input
                      id="depositAmt"
                      type="number"
                      placeholder="0.00"
                      value={inviteForm.securityDeposit}
                      onChange={e => setInviteForm({ ...inviteForm, securityDeposit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Lease Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={inviteForm.startDate}
                      onChange={e => setInviteForm({ ...inviteForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={inviteForm.endDate}
                      onChange={e => setInviteForm({ ...inviteForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Collection Config */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="colDay">Due Day</Label>
                    <Input
                      id="colDay"
                      type="number"
                      min="1"
                      max="28"
                      value={inviteForm.collectionDay}
                      onChange={e => setInviteForm({ ...inviteForm, collectionDay: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="graceP">Grace (Days)</Label>
                    <Input
                      id="graceP"
                      type="number"
                      min="0"
                      value={inviteForm.gracePeriodDays}
                      onChange={e => setInviteForm({ ...inviteForm, gracePeriodDays: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lateFee">Late Fee (Rs)</Label>
                    <Input
                      id="lateFee"
                      type="number"
                      min="0"
                      value={inviteForm.lateFeeFlat}
                      onChange={e => setInviteForm({ ...inviteForm, lateFeeFlat: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Leaving options */}
                <div className="space-y-1.5">
                  <Label>Leaving / Checkout Option</Label>
                  <Select value={inviteForm.leavingOption} onValueChange={val => setInviteForm({ ...inviteForm, leavingOption: val || "PAY_STAY_DATES" })}>
                    <SelectTrigger className="w-full">
                      <span className="flex flex-1 text-left truncate">
                        {inviteForm.leavingOption === "PAY_STAY_DATES" ? "Pay Stay Dates (Prorated)" : "Pay Full Month"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAY_STAY_DATES">Pay Stay Dates (Prorated)</SelectItem>
                      <SelectItem value="PAY_FULL_MONTH">Pay Full Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSaving}
                    className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {inviteSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send Lease Invite
                  </button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
