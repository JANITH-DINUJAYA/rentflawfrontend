"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Building2, Users, Plus, Loader2, AlertCircle, Check, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Package {
  id: string;
  name: string;
  price: number;
  max_properties: number;
  max_tenants: number;
  max_staff: number;
  is_active: boolean;
  is_custom?: boolean;
}

const emptyForm = { name: "", price: "", max_properties: "", max_tenants: "", max_staff: "" };

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<"PACKAGES" | "CUSTOM" | "BANK">("PACKAGES");
  const [packages, setPackages] = useState<Package[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [bankPayments, setBankPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit package states
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  // Custom request approval modal state
  const [approveCustomTarget, setApproveCustomTarget] = useState<any | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [approvingCustom, setApprovingCustom] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pkgRes, customRes, bankRes] = await Promise.all([
        api.get("/subscriptions/packages"),
        api.get("/subscriptions/custom-requests").catch(() => ({ data: [] })),
        api.get("/subscriptions/bank-payments").catch(() => ({ data: [] })),
      ]);
      setPackages(pkgRes.data);
      setCustomRequests(customRes.data);
      setBankPayments(bankRes.data);
    } catch {
      setError("Failed to load subscription information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.price || !form.max_properties || !form.max_tenants || !form.max_staff) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/subscriptions/packages", {
        name: form.name.trim(),
        price: parseFloat(form.price),
        max_properties: parseInt(form.max_properties),
        max_tenants: parseInt(form.max_tenants),
        max_staff: parseInt(form.max_staff),
      });
      setShowCreate(false);
      setForm(emptyForm);
      await fetchAllData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to create package.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackageId(pkg.id);
    setEditForm({
      name: pkg.name,
      price: String(pkg.price),
      max_properties: String(pkg.max_properties),
      max_tenants: String(pkg.max_tenants),
      max_staff: String(pkg.max_staff),
    });
    setFormError("");
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editForm.name.trim() || !editForm.price || !editForm.max_properties || !editForm.max_tenants || !editForm.max_staff) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/subscriptions/packages/${editingPackageId}`, {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        max_properties: parseInt(editForm.max_properties),
        max_tenants: parseInt(editForm.max_tenants),
        max_staff: parseInt(editForm.max_staff),
      });
      setShowEdit(false);
      await fetchAllData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to update package.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Delete package "${name}"? Soft-deleted packages are kept for 30 days.`)) return;
    try {
      await api.delete(`/subscriptions/packages/${id}`);
      await fetchAllData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot delete: package has active subscribers.");
    }
  };

  const handleApproveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveCustomTarget || !customPrice) return;
    setApprovingCustom(true);
    try {
      await api.post(`/subscriptions/custom-requests/${approveCustomTarget.id}/approve`, {
        price: parseFloat(customPrice),
      });
      alert("Custom package approved! It is now visible exclusively to the requesting landlord.");
      setApproveCustomTarget(null);
      setCustomPrice("");
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve custom request");
    } finally {
      setApprovingCustom(false);
    }
  };

  const handleRejectCustom = async (id: string) => {
    if (!confirm("Reject this custom package request?")) return;
    try {
      await api.post(`/subscriptions/custom-requests/${id}/reject`);
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject custom request");
    }
  };

  const handleApproveBankPayment = async (id: string) => {
    if (!confirm("Approve this bank transfer and activate the landlord's subscription?")) return;
    try {
      await api.patch(`/subscriptions/bank-payments/${id}/approve`);
      alert("Bank payment approved and subscription activated!");
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve bank payment");
    }
  };

  const handleRejectBankPayment = async (id: string) => {
    if (!confirm("Reject this bank transfer payment submission?")) return;
    try {
      await api.patch(`/subscriptions/bank-payments/${id}/reject`);
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject bank payment");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscriptions & Billing Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage pricing tiers, approve custom requests, and review bank transfer payments.</p>
        </div>
        {tab === "PACKAGES" && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> New Package
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-accent/20 p-1 mt-6 max-w-xl">
        <button
          onClick={() => setTab("PACKAGES")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            tab === "PACKAGES" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Package Tiers ({packages.length})
        </button>
        <button
          onClick={() => setTab("CUSTOM")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
            tab === "CUSTOM" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Custom Requests
          {customRequests.filter(r => r.status === "PENDING").length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px]">
              {customRequests.filter(r => r.status === "PENDING").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("BANK")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
            tab === "BANK" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bank Payments
          {bankPayments.filter(p => p.status === "PENDING_REVIEW").length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px]">
              {bankPayments.filter(p => p.status === "PENDING_REVIEW").length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tab === "PACKAGES" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.is_custom && <Badge className="bg-purple-600 text-white text-[9px]">CUSTOM</Badge>}
                    <Badge variant={pkg.is_active ? "default" : "secondary"} className="text-[10px]">
                      {pkg.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      title="Edit package"
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      title="Delete package"
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-xl font-extrabold mt-3">{pkg.name}</CardTitle>
                <p className="text-3xl font-black mt-1">
                  {pkg.price === 0 ? "Free" : `$${pkg.price}`}
                  {pkg.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center bg-accent/20 rounded-xl p-3">
                  {[
                    { label: "Properties", val: pkg.max_properties >= 999 ? "∞" : pkg.max_properties },
                    { label: "Tenants", val: pkg.max_tenants >= 999 ? "∞" : pkg.max_tenants },
                    { label: "Staff", val: pkg.max_staff >= 999 ? "∞" : pkg.max_staff },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                      <p className="text-lg font-extrabold">{val}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tab === "CUSTOM" ? (
        <div className="mt-6 space-y-4">
          {customRequests.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">No custom package requests found.</Card>
          ) : (
            customRequests.map((req) => (
              <Card key={req.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {req.landlord.company_name || `${req.landlord.user.first_name} ${req.landlord.user.last_name}`}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" :
                      req.status === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested Limits: <span className="font-semibold text-foreground">{req.max_properties} Properties</span> · <span className="font-semibold text-foreground">{req.max_tenants} Tenants</span> · <span className="font-semibold text-foreground">{req.max_staff} Staff</span>
                  </p>
                  {req.notes && <p className="text-xs text-muted-foreground italic">&ldquo;{req.notes}&rdquo;</p>}
                  {req.offered_price && <p className="text-xs font-bold text-primary">Approved Price: ${req.offered_price}/month</p>}
                </div>

                {req.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setApproveCustomTarget(req); setCustomPrice(""); }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:opacity-90 transition-all cursor-pointer"
                    >
                      Approve & Set Price
                    </button>
                    <button
                      onClick={() => handleRejectCustom(req.id)}
                      className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-bold rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        /* BANK TRANSFER PAYMENTS TAB */
        <div className="mt-6 space-y-4">
          {bankPayments.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">No bank transfer subscription payments found.</Card>
          ) : (
            bankPayments.map((p) => (
              <Card key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {p.landlord.company_name || `${p.landlord.user.first_name} ${p.landlord.user.last_name}`}
                    </span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      p.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" :
                      p.status === "REJECTED" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Package: <span className="font-bold text-foreground">{p.package.name}</span> · Amount: <span className="font-bold text-foreground">${p.amount}</span>
                  </p>
                  {p.notes && <p className="text-xs text-muted-foreground italic">Ref: {p.notes}</p>}
                  <a
                    href={p.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-primary font-bold hover:underline"
                  >
                    📄 View Uploaded Payment Receipt
                  </a>
                </div>

                {p.status === "PENDING_REVIEW" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveBankPayment(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      Approve & Activate
                    </button>
                    <button
                      onClick={() => handleRejectBankPayment(p.id)}
                      className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-bold rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Custom Request Approval Modal */}
      {approveCustomTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">Approve Custom Package</h3>
            <p className="text-xs text-muted-foreground">
              Set the monthly package price for {approveCustomTarget.landlord.company_name || approveCustomTarget.landlord.user.first_name}.
            </p>

            <form onSubmit={handleApproveCustom} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Monthly Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 150.00"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setApproveCustomTarget(null)}
                  className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvingCustom}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {approvingCustom ? "Approving..." : "Approve Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Package Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create Subscription Package</DialogTitle>
            <DialogDescription>Define a new SaaS tier for landlords to subscribe to.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pkg-name">Package Name</Label>
              <Input id="pkg-name" placeholder="e.g. Starter, Pro, Enterprise" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-price">Monthly Price ($)</Label>
                <Input id="pkg-price" type="number" min="0" step="0.01" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-props">Max Properties</Label>
                <Input id="pkg-props" type="number" min="1" placeholder="5" value={form.max_properties} onChange={e => setForm({ ...form, max_properties: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-tenants">Max Tenants</Label>
                <Input id="pkg-tenants" type="number" min="1" placeholder="100" value={form.max_tenants} onChange={e => setForm({ ...form, max_tenants: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-staff">Max Staff</Label>
                <Input id="pkg-staff" type="number" min="0" placeholder="5" value={form.max_staff} onChange={e => setForm({ ...form, max_staff: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Package
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Package</DialogTitle>
            <DialogDescription>Modify limits and price details for this SaaS tier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="edit-pkg-name">Package Name</Label>
              <Input id="edit-pkg-name" placeholder="e.g. Starter, Pro, Enterprise" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-pkg-price">Monthly Price ($)</Label>
                <Input id="edit-pkg-price" type="number" min="0" step="0.01" placeholder="0" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-pkg-props">Max Properties</Label>
                <Input id="edit-pkg-props" type="number" min="1" placeholder="5" value={editForm.max_properties} onChange={e => setEditForm({ ...editForm, max_properties: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-pkg-tenants">Max Tenants</Label>
                <Input id="edit-pkg-tenants" type="number" min="1" placeholder="100" value={editForm.max_tenants} onChange={e => setEditForm({ ...editForm, max_tenants: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-pkg-staff">Max Staff</Label>
                <Input id="edit-pkg-staff" type="number" min="0" placeholder="5" value={editForm.max_staff} onChange={e => setEditForm({ ...editForm, max_staff: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Update Package
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
