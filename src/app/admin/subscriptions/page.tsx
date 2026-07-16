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
}

const ICONS = [Star, Crown, Building2];
const COLORS = ["text-blue-500", "text-yellow-500", "text-purple-500"];
const BG = ["bg-blue-500/10", "bg-yellow-500/10", "bg-purple-500/10"];

const emptyForm = { name: "", price: "", max_properties: "", max_tenants: "", max_staff: "" };

export default function AdminSubscriptionsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/subscriptions/packages");
      setPackages(res.data);
    } catch {
      setError("Failed to load subscription packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

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
      await fetchPackages();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to create package.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Delete package "${name}"? This will fail if any landlords are actively subscribed to it.`)) return;
    try {
      await api.delete(`/subscriptions/packages/${id}`);
      await fetchPackages();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot delete: package has active subscribers.");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Packages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage SaaS plans available to landlords.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Package
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchPackages} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <Crown className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No packages yet</p>
          <p className="text-sm text-muted-foreground">Create your first subscription package to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, i) => {
            const Icon = ICONS[i % ICONS.length];
            const color = COLORS[i % COLORS.length];
            const bg = BG[i % BG.length];
            return (
              <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: "var(--primary)" }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pkg.is_active ? "default" : "secondary"} className="text-[10px]">
                        {pkg.is_active ? "Active" : "Inactive"}
                      </Badge>
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

                  <ul className="space-y-1.5">
                    {[
                      `Up to ${pkg.max_properties >= 999 ? "unlimited" : pkg.max_properties} properties`,
                      `Up to ${pkg.max_tenants >= 999 ? "unlimited" : pkg.max_tenants} tenants`,
                      `Up to ${pkg.max_staff >= 999 ? "unlimited" : pkg.max_staff} staff members`,
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
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
    </DashboardLayout>
  );
}
