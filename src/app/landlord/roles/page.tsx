"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Shield, Users, PlusCircle, Trash2, Loader2, AlertCircle, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  { action: "MANAGE_PROPERTIES", label: "Manage Properties", desc: "Create, update, and archive properties" },
  { action: "MANAGE_FLOORS_ROOMS", label: "Manage Floors & Rooms", desc: "Structure buildings and assign rooms" },
  { action: "MANAGE_TENANTS", label: "Manage Tenants", desc: "Invite, view, and assign tenant details" },
  { action: "MANAGE_AGREEMENTS", label: "Manage Rental Agreements", desc: "Draft, activate, and terminate agreements" },
  { action: "MANAGE_INVOICES", label: "Manage Invoices", desc: "Generate, discount, and review invoices" },
  { action: "APPROVE_PAYMENTS", label: "Approve Payments", desc: "Review and approve/reject tenant submissions" },
  { action: "MANAGE_UTILITIES", label: "Manage Utilities", desc: "Record metered utility readings and bills" },
  { action: "VIEW_REPORTS", label: "View Reports", desc: "Access property reports and financial analytics" },
];

const emptyStaffForm = { email: "", first_name: "", last_name: "", phone: "", role_id: "", password: "" };

export default function LandlordRolesPage() {
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
      setError("Failed to load roles and staff profiles.");
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
      setRoleError(Array.isArray(msg) ? msg[0] : msg || "Failed to create role.");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom role?")) return;
    try {
      await api.delete(`/roles/${id}`);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot delete role (likely assigned to active staff).");
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
      alert("Failed to update role permissions.");
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
      setShowAddStaff(false);
      setStaffForm({ ...emptyStaffForm, role_id: roles[0]?.id || "" });
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setStaffError(Array.isArray(msg) ? msg[0] : msg || "Failed to add staff member.");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      await fetchData();
    } catch (err: any) {
      alert("Failed to remove staff member.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff & Roles</h2>
          <p className="text-sm text-muted-foreground">Manage your custom staff roles, assign fine-grained permissions, and invite team members.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "roles" ? (
            <button
              onClick={() => setShowAddRole(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" /> Add Custom Role
            </button>
          ) : (
            <button
              disabled={roles.length === 0}
              onClick={() => setShowAddStaff(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle className="h-4 w-4" /> Invite Staff
            </button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "roles" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          🔑 Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "staff" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          👥 Active Staff
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : activeTab === "roles" ? (
        <div className="space-y-6">
          {roles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-bold">No custom roles yet</p>
              <p className="text-sm text-muted-foreground">Add a custom role to grant custom dashboard permissions to your staff.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roles.map(role => (
                <Card key={role.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{role.name}</CardTitle>
                      <CardDescription>Configure access permissions for this staff role.</CardDescription>
                    </div>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Permissions Configuration</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {AVAILABLE_PERMISSIONS.map(p => {
                          const hasPerm = role.permissions.some(rp => rp.action === p.action);
                          return (
                            <button
                              key={p.action}
                              onClick={() => handleTogglePermission(role, p.action)}
                              className={`flex items-start gap-2.5 p-2 rounded-xl text-left border transition-all cursor-pointer ${hasPerm ? "border-primary/30 bg-primary/5 text-primary" : "border-border hover:bg-accent/40"}`}
                            >
                              <div className="mt-0.5">
                                {hasPerm ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold">{p.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">{p.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {staff.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-bold">No active staff members</p>
              <p className="text-sm text-muted-foreground">Invite staff members to manage your properties with limited access.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Assigned Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map(member => (
                      <TableRow key={member.id} className="hover:bg-accent/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {member.user.first_name?.[0]}{member.user.last_name?.[0]}
                            </div>
                            <span className="font-semibold text-sm">{member.user.first_name} {member.user.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{member.user.email}</TableCell>
                        <TableCell className="text-sm">{member.user.phone}</TableCell>
                        <TableCell>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {member.role?.name || "No Role"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleRemoveStaff(member.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Custom Role</DialogTitle>
            <DialogDescription>Define a new organizational role for your staff.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRole} className="space-y-4 pt-2">
            {roleError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{roleError}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role Name</Label>
              <Input id="role-name" placeholder="e.g. Property Manager, Maintenance Tech" value={roleName} onChange={e => setRoleName(e.target.value)} />
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

      {/* Invite Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>Add a team member and link them to a custom role. They can log in using their email and the password <strong>StaffSecure123!</strong>.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
            {staffError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{staffError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="staff-fn">First Name</Label>
                <Input id="staff-fn" placeholder="e.g. John" value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-ln">Last Name</Label>
                <Input id="staff-ln" placeholder="e.g. Doe" value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email Address</Label>
              <Input id="staff-email" type="email" placeholder="staff@example.com" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">Phone Number</Label>
              <Input id="staff-phone" placeholder="+947..." value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-password">Login Password</Label>
              <Input id="staff-password" type="password" placeholder="Min 8 characters" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
              <p className="text-[10px] text-muted-foreground">This will be the staff member&apos;s login password. Share it with them securely.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Select Role</Label>
              <Select value={staffForm.role_id} onValueChange={v => { if (v) setStaffForm({ ...staffForm, role_id: v }); }}>
                <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowAddStaff(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={staffSaving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {staffSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Invite Staff
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
