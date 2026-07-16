"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Shield, Users, PlusCircle, Trash2, Loader2, AlertCircle, CheckSquare, Square } from "lucide-react";
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

const AVAILABLE_PERMISSIONS = [
  { action: "MANAGE_LANDLORDS", label: "Manage Landlords", desc: "Create, edit, and delete landlord accounts" },
  { action: "MANAGE_TENANTS", label: "Manage Tenants", desc: "Create, edit, and delete tenant accounts" },
  { action: "MANAGE_PROPERTIES", label: "Manage Properties", desc: "View and soft archive all platform properties" },
  { action: "MANAGE_AGREEMENTS", label: "Manage Agreements", desc: "Monitor lease agreements and authorize tenant leaves" },
  { action: "MANAGE_SUBSCRIPTIONS", label: "Manage Subscriptions", desc: "Create and delete subscription packages" },
  { action: "SYSTEM_SUPPORT", label: "System Chat Support", desc: "Communicate with platform users via system chat" },
];

const emptyStaffForm = { email: "", first_name: "", last_name: "", phone: "", role_id: "" };

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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, first_name, last_name, phone, role_id } = staffForm;
    if (!email || !first_name || !last_name || !phone || !role_id) {
      setStaffError("All fields are required.");
      return;
    }
    setStaffSaving(true);
    setStaffError("");
    try {
      await api.post("/staff", staffForm);
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
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABLE_PERMISSIONS.map(p => {
                        const hasPerm = role.permissions.some(rp => rp.action === p.action);
                        return (
                          <button
                            key={p.action}
                            onClick={() => handleTogglePermission(role, p.action)}
                            className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all text-left cursor-pointer"
                          >
                            {hasPerm ? (
                              <CheckSquare className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-bold">{p.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{p.desc}</p>
                            </div>
                          </button>
                        );
                      })}
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
            <div className="space-y-1.5">
              <Label htmlFor="srole">Assigned System Role</Label>
              <Select value={staffForm.role_id} onValueChange={val => setStaffForm({ ...staffForm, role_id: val ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a system role" />
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
  );
}
