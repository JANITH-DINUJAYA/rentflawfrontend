"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Shield, Users, PlusCircle, Trash2, Loader2, AlertCircle, CheckSquare, Square, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

interface Permission {
  id: string;
  action: string;
}

interface CustomRole {
  id: string;
  name: string;
  permissions: Permission[];
}

interface StaffMember {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  role: {
    name: string;
  };
}

// Permissions are now grouped by resource domain with CRUD operations
const PERMISSION_GROUPS = [
  {
    group: "Landlords",
    permissions: [
      { action: "landlords:read",   label: "View Landlords",   desc: "Browse registered landlord accounts" },
      { action: "landlords:create", label: "Create Landlord",  desc: "Register new landlord accounts" },
      { action: "landlords:update", label: "Edit Landlord",    desc: "Update landlord details and status" },
      { action: "landlords:delete", label: "Delete Landlord",  desc: "Remove landlord accounts" },
    ],
  },
  {
    group: "Tenants",
    permissions: [
      { action: "tenants:read",   label: "View Tenants",   desc: "Browse registered tenant accounts" },
      { action: "tenants:create", label: "Create Tenant",  desc: "Register new tenant accounts" },
      { action: "tenants:update", label: "Edit Tenant",    desc: "Update tenant details" },
      { action: "tenants:delete", label: "Delete Tenant",  desc: "Remove tenant accounts" },
    ],
  },
  {
    group: "Properties",
    permissions: [
      { action: "properties:read",   label: "View Properties",   desc: "Browse all platform properties" },
      { action: "properties:update", label: "Edit Property",     desc: "Update property information" },
      { action: "properties:delete", label: "Archive Property",  desc: "Soft-archive properties" },
    ],
  },
  {
    group: "Agreements",
    permissions: [
      { action: "agreements:read",   label: "View Agreements",      desc: "Browse platform lease agreements" },
      { action: "agreements:delete", label: "Terminate Agreement",  desc: "Force-terminate any agreement" },
    ],
  },
  {
    group: "Subscriptions",
    permissions: [
      { action: "subscriptions:read",   label: "View Packages",    desc: "Browse subscription packages" },
      { action: "subscriptions:create", label: "Create Package",   desc: "Create new pricing tiers" },
      { action: "subscriptions:delete", label: "Delete Package",   desc: "Remove unused packages" },
    ],
  },
  {
    group: "System",
    permissions: [
      { action: "roles:read",   label: "View Roles",     desc: "Browse system roles & staff" },
      { action: "roles:create", label: "Create Roles",   desc: "Define new system-level roles" },
      { action: "roles:delete", label: "Delete Roles",   desc: "Remove unused roles" },
      { action: "staff:read",   label: "View Staff",     desc: "Browse system staff profiles" },
      { action: "staff:create", label: "Add Staff",      desc: "Invite new system staff members" },
      { action: "staff:delete", label: "Remove Staff",   desc: "Delete system staff profiles" },
      { action: "system:read",  label: "System Config",  desc: "Access system settings" },
    ],
  },
  {
    group: "Payouts & Refunds",
    permissions: [
      { action: "refunds:read",   label: "View Payouts",    desc: "Access platform payouts and refunds" },
      { action: "refunds:update", label: "Process Payout",  desc: "Settle refunds globally" },
    ],
  },
];

const emptyStaffForm = { email: "", first_name: "", last_name: "", phone: "", role_id: "", password: "" };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role Form
  const [showAddRole, setShowAddRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");

  // Staff Form
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState<"roles" | "staff">("roles");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, staffRes] = await Promise.all([
        api.get("/roles"),
        api.get("/staff"),
      ]);
      setRoles(rolesRes.data);
      setStaff(staffRes.data);
      if (rolesRes.data.length > 0 && !staffForm.role_id) {
        setStaffForm(f => ({ ...f, role_id: rolesRes.data[0].id }));
      }
    } catch {
      setError("Failed to load platform roles and admin staff profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) { setRoleError("Role name is required."); return; }
    setRoleSaving(true);
    setRoleError("");
    try {
      await api.post("/roles", { name: roleName.trim() });
      setShowAddRole(false);
      setRoleName("");
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setRoleError(Array.isArray(msg) ? msg[0] : msg || "Failed to create system role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom system role?")) return;
    try {
      await api.delete(`/roles/${id}`);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot delete system role (likely assigned to active staff).");
    }
  };

  const handleTogglePermission = async (role: CustomRole, action: string) => {
    const existing = role.permissions.find(p => p.action === action);
    try {
      if (existing) {
        await api.delete(`/roles/${role.id}/permissions/${existing.id}`);
      } else {
        await api.post(`/roles/${role.id}/permissions`, { action });
      }
      await fetchData();
    } catch (err: any) {
      alert("Failed to update system role permissions.");
    }
  };

  const handleToggleAllPermissions = async (role: CustomRole, grantAll: boolean) => {
    try {
      const actions = grantAll
        ? PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.action))
        : [];
      await api.put(`/roles/${role.id}/permissions`, { actions });
      await fetchData();
    } catch {
      alert("Failed to update system role permissions.");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, first_name, last_name, phone, role_id, password } = staffForm;
    if (!email || !first_name || !last_name || !phone || !role_id || !password) {
      setStaffError("All fields including password are required.");
      return;
    }
    if (password.length < 8) {
      setStaffError("Password must be at least 8 characters.");
      return;
    }
    setStaffSaving(true);
    setStaffError("");
    try {
      await api.post("/staff", staffForm);
      // Save credentials before clearing form — show them to admin
      setCreatedStaff({ email, password });
      setShowAddStaff(false);
      setStaffForm({ ...emptyStaffForm, role_id: roles[0]?.id || "" });
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setStaffError(Array.isArray(msg) ? msg[0] : msg || "Failed to add system staff member.");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStaff) return;
    navigator.clipboard.writeText(`Email: ${createdStaff.email}\nPassword: ${createdStaff.password}\nLogin URL: https://rentflaw.vercel.app/admin/login`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this system staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove staff member.");
    }
  };

  return (
    <>
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Roles & Staff</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configure access roles, permissions, and provision administrative staff.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchData} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-border gap-6">
            <button
              onClick={() => setActiveTab("roles")}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${
                activeTab === "roles" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              System Roles & Permissions
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${
                activeTab === "staff" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Administrative Staff ({staff.length})
            </button>
          </div>

          {/* TAB 1: Roles */}
          {activeTab === "roles" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Roles List */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Access Roles</CardTitle>
                      <CardDescription className="text-xs">Custom system RBAC configuration</CardDescription>
                    </div>
                    <button
                      onClick={() => setShowAddRole(true)}
                      className="p-1 rounded-lg hover:bg-accent text-primary transition-colors cursor-pointer"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1">
                    {roles.length === 0 ? (
                      <p className="text-center py-6 text-xs text-muted-foreground">No roles configured.</p>
                    ) : (
                      roles.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-accent/40">
                          <div>
                            <p className="text-xs font-bold">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground">{r.permissions.length} permissions assigned</p>
                          </div>
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Permissions Grid */}
              <div className="lg:col-span-2 space-y-6">
                {roles.map(role => (
                  <Card key={role.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                        <Shield className="h-4.5 w-4.5 text-primary" /> Permissions Matrix: {role.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-2 justify-end mb-4 border-b border-border pb-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAllPermissions(role, true)}
                          className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        >
                          Select All (Super Admin)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAllPermissions(role, false)}
                          className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-border hover:bg-accent/40 text-muted-foreground transition-all cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                      {PERMISSION_GROUPS.map(grp => (
                        <div key={grp.group} className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1">
                            {grp.group}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {grp.permissions.map(p => {
                              const hasPerm = role.permissions.some(rp => rp.action === p.action);
                              return (
                                <button
                                  key={p.action}
                                  onClick={() => handleTogglePermission(role, p.action)}
                                  className="flex items-start gap-2.5 p-2 rounded-sm border border-border bg-card hover:border-primary/40 hover:bg-accent/10 transition-all text-left cursor-pointer"
                                >
                                  {hasPerm ? (
                                    <CheckSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className="text-xs font-bold leading-tight">{p.label}</p>
                                    <p className="text-[9px] text-muted-foreground leading-normal mt-0.5">{p.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Staff */}
          {activeTab === "staff" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold">Administrative Staff Members</CardTitle>
                  <CardDescription className="text-xs">Manage system-level support and administrators</CardDescription>
                </div>
                <button
                  onClick={() => setShowAddStaff(true)}
                  disabled={roles.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Staff Member
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>System Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No system staff accounts provisioned yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      staff.map(s => (
                        <TableRow key={s.id} className="hover:bg-accent/20 transition-colors">
                          <TableCell className="font-semibold text-xs">
                            {s.user.first_name} {s.user.last_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-[10px]">
                              {s.role.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{s.user.email}</TableCell>
                          <TableCell className="text-xs">{s.user.phone}</TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => handleDeleteStaff(s.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 border border-border hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Create System Role</DialogTitle>
          </DialogHeader>
          {roleError && <p className="text-xs text-destructive font-medium">{roleError}</p>}
          <form onSubmit={handleAddRole} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="rname">Role Name</Label>
              <Input id="rname" placeholder="e.g. Support Specialist" value={roleName} onChange={e => setRoleName(e.target.value)} required />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowAddRole(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={roleSaving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {roleSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Role
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">Provision System Staff</DialogTitle>
            <DialogDescription>Setup system staff permissions and login account.</DialogDescription>
          </DialogHeader>
          {staffError && <p className="text-xs text-destructive font-medium">{staffError}</p>}
          <form onSubmit={handleAddStaff} className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sfn">First Name</Label>
                <Input id="sfn" value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sln">Last Name</Label>
                <Input id="sln" value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="semail">Email Address</Label>
              <Input id="semail" type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sphone">Phone Number</Label>
              <Input id="sphone" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="spassword">Login Password</Label>
              <div className="relative">
                <Input
                  id="spassword"
                  type={showStaffPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={staffForm.password}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showStaffPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">After saving, credentials will be shown for you to share.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="srole">Assigned System Role</Label>
              <Select value={staffForm.role_id} onValueChange={val => setStaffForm({ ...staffForm, role_id: val ?? "" })}>
                <SelectTrigger>
                  {staffForm.role_id
                    ? <span className="flex flex-1 text-left truncate">{roles.find(r => r.id === staffForm.role_id)?.name ?? staffForm.role_id}</span>
                    : <SelectValue placeholder="Select a system role" />}
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setShowAddStaff(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={staffSaving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {staffSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Provision Account
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>

      {/* Created Staff Credentials Modal */}
      <Dialog open={!!createdStaff} onOpenChange={() => setCreatedStaff(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" /> Staff Account Created
            </DialogTitle>
            <DialogDescription>Share these login credentials securely with the staff member. This dialog will not appear again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-4 rounded-sm bg-accent/30 border border-border space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-bold">{createdStaff?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-bold">{createdStaff?.password}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Login URL:</span>
                <span className="font-bold text-primary">/admin/login</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">⚠️ Assign permissions to their role before they can access platform sections.</p>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={handleCopyCredentials}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-sm border border-border hover:bg-accent/50 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Credentials"}
            </button>
            <button
              onClick={() => setCreatedStaff(null)}
              className="px-4 py-2 text-xs font-bold rounded-sm bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
