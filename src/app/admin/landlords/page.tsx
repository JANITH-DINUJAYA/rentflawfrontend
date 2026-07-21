"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Building2, Search, Loader2, AlertCircle, Plus, Edit2, Trash2 } from "lucide-react";
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
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Landlord
        </button>
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
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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

                    return (
                      <TableRow key={l.id} className="hover:bg-accent/20 transition-colors">
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
