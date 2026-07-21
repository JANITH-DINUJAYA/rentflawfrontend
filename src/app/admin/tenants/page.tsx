"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, Square, CheckSquare } from "lucide-react";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nic_or_passport: string;
  tenant_code: string | null;
  created_at: string;
  rental_agreements?: { status: string }[];
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states
  const [targetId, setTargetId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nic, setNic] = useState("");
  const [password, setPassword] = useState("");

  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to de-activate the ${selectedIds.length} selected tenants?`)) return;
    setBulkDeleting(true);
    try {
      await api.post("/tenants/bulk-delete", { ids: selectedIds });
      setSelectedIds([]);
      await fetchTenants();
    } catch {
      alert("Failed to bulk de-activate tenants.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = (filteredData: Tenant[]) => {
    const filteredIds = filteredData.map(t => t.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...Array.from(new Set([...prev, ...filteredIds]))]);
    }
  };

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/tenants");
      setTenants(res.data);
    } catch {
      setError("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const openCreate = () => {
    setFormError("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNic("");
    setPassword("");
    setCreateOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setFormError("");
    setTargetId(t.id);
    setFirstName(t.first_name);
    setLastName(t.last_name);
    setEmail(t.email);
    setPhone(t.phone);
    setNic(t.nic_or_passport || "");
    setEditOpen(true);
  };

  const openDelete = (id: string) => {
    setFormError("");
    setTargetId(id);
    setDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormPending(true);
    setFormError("");
    try {
      await api.post("/tenants", {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nic_or_passport: nic,
        password: password || undefined,
      });
      setCreateOpen(false);
      fetchTenants();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create tenant.");
    } finally {
      setFormPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormPending(true);
    setFormError("");
    try {
      await api.patch(`/tenants/${targetId}`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nic_or_passport: nic,
      });
      setEditOpen(false);
      fetchTenants();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update tenant.");
    } finally {
      setFormPending(false);
    }
  };

  const handleDelete = async () => {
    setFormPending(true);
    setFormError("");
    try {
      await api.delete(`/tenants/${targetId}`);
      setDeleteOpen(false);
      fetchTenants();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to delete tenant.");
    } finally {
      setFormPending(false);
    }
  };

  const filtered = tenants.filter(t =>
    `${t.first_name} ${t.last_name} ${t.email} ${t.tenant_code || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenant Accounts</h2>
          <p className="text-sm text-muted-foreground">All registered tenants across the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 shadow-md shadow-destructive/10 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {bulkDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Deactivate Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Create Tenant
          </button>
        </div>
      </div>

      {/* Table Export Controls */}
      <div className="mt-6">
        <TableExportControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tenants by name, email or code..."
          tableData={filtered.map(t => ({
            name: `${t.first_name} ${t.last_name}`,
            tenant_code: t.tenant_code || "N/A",
            email: t.email,
            phone: t.phone,
            nic_passport: t.nic_or_passport,
            agreements: `${t.rental_agreements?.length || 0} leases`,
            joined_date: new Date(t.created_at).toLocaleDateString(),
          }))}
          columns={[
            { key: "name", label: "Tenant Name" },
            { key: "tenant_code", label: "Share Code" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "nic_passport", label: "NIC / Passport" },
            { key: "agreements", label: "Agreements Count" },
            { key: "joined_date", label: "Joined Date" },
          ]}
          filename="tenants_report"
          title="Tenant Accounts Report"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchTenants} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <button
                      onClick={() => handleToggleSelectAll(filtered)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {filtered.length > 0 && filtered.every(t => selectedIds.includes(t.id)) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Share Code</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NIC / Passport</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {search ? `No tenants matching "${search}"` : "No tenants registered yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(t => {
                    const hasActive = t.rental_agreements?.some(a => a.status === "ACTIVE");
                    const isSelected = selectedIds.includes(t.id);
                    return (
                      <TableRow key={t.id} className={`hover:bg-accent/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleSelect(t.id)}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {t.first_name?.[0]}{t.last_name?.[0]}
                            </div>
                            <span className="font-semibold text-sm">{t.first_name} {t.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono font-bold tracking-wider">{t.tenant_code || "—"}</TableCell>
                        <TableCell className="text-sm">{t.email}</TableCell>
                        <TableCell className="text-sm">{t.phone}</TableCell>
                        <TableCell className="text-sm font-mono">{t.nic_or_passport}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={hasActive ? "default" : "secondary"} className="text-[10px]">
                            {hasActive ? "Active Tenant" : "No Active Lease"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(t)}
                              className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Edit details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(t.id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete tenant"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Create Tenant Profile</DialogTitle>
            <DialogDescription>Setup a new tenant user account on the platform.</DialogDescription>
          </DialogHeader>
          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}
          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-fn">First Name</Label>
                <Input id="c-fn" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-ln">Last Name</Label>
                <Input id="c-ln" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-email">Email Address</Label>
              <Input id="c-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-phone">Phone Number</Label>
                <Input id="c-phone" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="c-nic">NIC or Passport</Label>
                <Input id="c-nic" value={nic} onChange={e => setNic(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-pw">Temporary Password (Optional)</Label>
              <Input id="c-pw" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <DialogFooter className="pt-3">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={formPending} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {formPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Account
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Edit Tenant Profile</DialogTitle>
            <DialogDescription>Modify user contact details or references.</DialogDescription>
          </DialogHeader>
          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}
          <form onSubmit={handleUpdate} className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="e-fn">First Name</Label>
                <Input id="e-fn" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="e-ln">Last Name</Label>
                <Input id="e-ln" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-email">Email Address</Label>
              <Input id="e-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="e-phone">Phone Number</Label>
                <Input id="e-phone" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="e-nic">NIC or Passport</Label>
                <Input id="e-nic" value={nic} onChange={e => setNic(e.target.value)} required />
              </div>
            </div>
            <DialogFooter className="pt-3">
              <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={formPending} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {formPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Tenant Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant?
              This action is permanent and will cascade delete all linked details.
            </DialogDescription>
          </DialogHeader>
          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}
          <DialogFooter className="gap-2">
            <button onClick={() => setDeleteOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={handleDelete} disabled={formPending} className="px-4 py-2 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {formPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
