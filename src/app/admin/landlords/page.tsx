"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Building2, Search, Loader2, AlertCircle, Plus, Edit2, Trash2, Square, CheckSquare, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

interface Landlord {
  id: string;
  company_name: string | null;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    nic_or_passport: string;
    created_at: string;
  };
  subscription?: {
    package: {
      name: string;
    };
  } | null;
}

export default function AdminLandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
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
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to de-activate the ${selectedIds.length} selected landlords?`)) return;
    setBulkDeleting(true);
    try {
      await api.post("/landlords/bulk-delete", { ids: selectedIds });
      setSelectedIds([]);
      await fetchLandlords();
    } catch {
      alert("Failed to bulk de-activate landlords.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = (filteredData: Landlord[]) => {
    const filteredIds = filteredData.map(l => l.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...Array.from(new Set([...prev, ...filteredIds]))]);
    }
  };

  const fetchLandlords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/landlords");
      setLandlords(res.data);
    } catch (err: any) {
      setError("Failed to load landlords. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLandlords(); }, []);

  const openCreate = () => {
    setFormError("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNic("");
    setCompanyName("");
    setPassword("");
    setCreateOpen(true);
  };

  const openEdit = (l: Landlord) => {
    setFormError("");
    setTargetId(l.id);
    setFirstName(l.user.first_name);
    setLastName(l.user.last_name);
    setEmail(l.user.email);
    setPhone(l.user.phone);
    setNic(l.user.nic_or_passport);
    setCompanyName(l.company_name || "");
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
      await api.post("/landlords", {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nic_or_passport: nic,
        company_name: companyName || null,
        password: password || undefined,
      });
      setCreateOpen(false);
      fetchLandlords();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create landlord.");
    } finally {
      setFormPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormPending(true);
    setFormError("");
    try {
      await api.patch(`/landlords/${targetId}`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nic_or_passport: nic,
        company_name: companyName || null,
      });
      setEditOpen(false);
      fetchLandlords();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to update landlord.");
    } finally {
      setFormPending(false);
    }
  };

  const handleDelete = async () => {
    setFormPending(true);
    setFormError("");
    try {
      await api.delete(`/landlords/${targetId}`);
      setDeleteOpen(false);
      fetchLandlords();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to delete landlord.");
    } finally {
      setFormPending(false);
    }
  };

  const handlePrintLandlord = (l: any) => {
    const planName = l.subscription?.package?.name || "No Plan";
    const status = l.user.is_active ? "Active" : "Inactive";
    const html = `
      <html>
        <head>
          <title>Landlord Details - ${l.user.first_name} ${l.user.last_name}</title>
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
            <div class="brand">RentFlaw<span>Landlord Account Profile</span></div>
            <div class="badge" style="background:${l.user.is_active ? '#d1fae5' : '#fee2e2'};color:${l.user.is_active ? '#059669' : '#dc2626'}">${status}</div>
          </div>
          <h2>Personal Information</h2>
          <div class="grid">
            <div class="field"><label>Full Name</label><p>${l.user.first_name} ${l.user.last_name}</p></div>
            <div class="field"><label>Email Address</label><p>${l.user.email}</p></div>
            <div class="field"><label>Phone Number</label><p>${l.user.phone || '—'}</p></div>
            <div class="field"><label>NIC / Passport</label><p>${l.user.nic_or_passport || '—'}</p></div>
          </div>
          <h2>Business & Plan Details</h2>
          <div class="grid">
            <div class="field"><label>Company / Landlord Name</label><p>${l.company_name || 'Private Landlord'}</p></div>
            <div class="field"><label>Current Subscription Plan</label><p>${planName}</p></div>
            <div class="field"><label>Registered Since</label><p>${new Date(l.user.created_at).toLocaleDateString()}</p></div>
            <div class="field"><label>Max Properties / Tenants Allowed</label><p>${l.subscription?.package?.max_properties ?? '∞'} / ${l.subscription?.package?.max_tenants ?? '∞'}</p></div>
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

  const filtered = landlords.filter(l =>
    `${l.user.first_name} ${l.user.last_name} ${l.user.email} ${l.company_name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Landlord Accounts</h2>
          <p className="text-sm text-muted-foreground">All registered landlords on the RentFlaw platform.</p>
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
            <Plus className="mr-1.5 h-4 w-4" /> Create Landlord
          </button>
        </div>
      </div>

      {/* Table Export Controls */}
      <div className="mt-6">
        <TableExportControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search landlords by name, email or company..."
          tableData={filtered.map(l => ({
            name: `${l.user.first_name} ${l.user.last_name}`,
            email: l.user.email,
            phone: l.user.phone,
            company: l.company_name || "N/A",
            nic_passport: l.user.nic_or_passport,
            subscription: l.subscription?.package?.name || "None",
            joined_date: new Date(l.user.created_at).toLocaleDateString(),
          }))}
          columns={[
            { key: "name", label: "Landlord Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "company", label: "Company" },
            { key: "nic_passport", label: "NIC / Passport" },
            { key: "subscription", label: "Subscription" },
            { key: "joined_date", label: "Joined Date" },
          ]}
          filename="landlords_report"
          title="Landlord Accounts Report"
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
          <button onClick={fetchLandlords} className="text-primary hover:underline text-xs">Retry</button>
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
                      {filtered.length > 0 && filtered.every(l => selectedIds.includes(l.id)) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NIC / Passport</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {search ? `No landlords matching "${search}"` : "No landlords registered yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(l => {
                    const planName = l.subscription?.package?.name || "No Plan";
                    const isEnterprise = planName.toLowerCase().includes("enterprise");
                    const isPro = planName.toLowerCase().includes("pro");
                    const badgeClass = isEnterprise
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/25 font-bold"
                      : isPro
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/25 font-bold"
                      : "bg-muted text-muted-foreground font-bold";

                    const isSelected = selectedIds.includes(l.id);

                    return (
                      <TableRow key={l.id} className={`hover:bg-accent/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleSelect(l.id)}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {l.user.first_name?.[0]}{l.user.last_name?.[0]}
                            </div>
                            <span className="font-semibold text-sm">{l.user.first_name} {l.user.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.company_name || "—"}</TableCell>
                        <TableCell className="text-sm">{l.user.email}</TableCell>
                        <TableCell className="text-sm">{l.user.phone}</TableCell>
                        <TableCell className="text-sm font-mono">{l.user.nic_or_passport}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClass}>
                            {planName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(l.user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handlePrintLandlord(l)}
                              className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Print landlord details"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(l)}
                              className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                              title="Edit details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(l.id)}
                              className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete landlord"
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
            <DialogTitle className="text-base font-extrabold">Create Landlord Profile</DialogTitle>
            <DialogDescription>Setup a new landlord user and company details.</DialogDescription>
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
              <Label htmlFor="c-cn">Company Name (Optional)</Label>
              <Input id="c-cn" value={companyName} onChange={e => setCompanyName(e.target.value)} />
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
            <DialogTitle className="text-base font-extrabold">Edit Landlord Profile</DialogTitle>
            <DialogDescription>Modify user or company information.</DialogDescription>
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
            <div className="space-y-1">
              <Label htmlFor="e-cn">Company Name (Optional)</Label>
              <Input id="e-cn" value={companyName} onChange={e => setCompanyName(e.target.value)} />
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
            <DialogTitle className="text-red-500">Delete Landlord Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this landlord?
              This action is permanent and will cascade delete all linked profiles.
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
