"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Shield, Users, PlusCircle, Trash2, Loader2, AlertCircle, CheckSquare, Square, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

// Permissions grouped by resource domain with CRUD operations
const PERMISSION_GROUPS = [
  {
    group: "Properties",
    permissions: [
      { action: "properties:read",   label: "View Properties",   desc: "Browse properties profile" },
      { action: "properties:create", label: "Create Property",  desc: "Add new buildings & houses" },
      { action: "properties:update", label: "Edit Property",    desc: "Update building properties info" },
      { action: "properties:delete", label: "Archive Property",  desc: "Soft-archive properties" },
    ],
  },
  {
    group: "Floors & Rooms",
    permissions: [
      { action: "rooms:read",   label: "View Rooms",   desc: "Browse rooms and floors layout" },
      { action: "rooms:create", label: "Create Rooms",  desc: "Add rooms to building floors" },
      { action: "rooms:update", label: "Edit Rooms",    desc: "Update room number and rent price" },
      { action: "rooms:delete", label: "Archive Rooms",  desc: "Archive vacant rooms" },
    ],
  },
  {
    group: "Tenants",
    permissions: [
      { action: "tenants:read",   label: "View Tenants",   desc: "Browse active & past tenants" },
      { action: "tenants:create", label: "Invite Tenant",  desc: "Send digital invitation code" },
      { action: "tenants:update", label: "Edit Tenant",    desc: "Update tenant rental identity" },
    ],
  },
  {
    group: "Agreements",
    permissions: [
      { action: "agreements:read",   label: "View Agreements",      desc: "Browse rental agreement list" },
      { action: "agreements:create", label: "Create Agreement",     desc: "Draft lease invitation terms" },
      { action: "agreements:update", label: "Activate Agreement",   desc: "Approve and activate standard lease" },
      { action: "agreements:delete", label: "Terminate Agreement",  desc: "Settle and close active agreement" },
    ],
  },
  {
    group: "Invoices",
    permissions: [
      { action: "invoices:read",   label: "View Invoices",    desc: "Browse generated rent invoices" },
      { action: "invoices:create", label: "Manual Invoice",   desc: "Generate manual ad-hoc invoice" },
      { action: "invoices:update", label: "Apply Discount",   desc: "Discount outstanding balances" },
    ],
  },
  {
    group: "Payments",
    permissions: [
      { action: "payments:read",   label: "View Payments",    desc: "Browse payment submission logs" },
      { action: "payments:update", label: "Approve Payment",  desc: "Verify bank slips and mark paid" },
    ],
  },
  {
    group: "Utilities",
    permissions: [
      { action: "utilities:read",   label: "View Utilities",   desc: "Browse utility bill logs" },
      { action: "utilities:create", label: "Record Reading",   desc: "Input water & electricity meters" },
    ],
  },
  {
    group: "Reports & Analytics",
    permissions: [
      { action: "reports:read",   label: "View Reports",     desc: "Access financial and occupancy data" },
    ],
  },
  {
    group: "Inbox",
    permissions: [
      { action: "messages:read",   label: "View Inbox",    desc: "Access tenant message conversations" },
      { action: "messages:create", label: "Send Messages", desc: "Reply to tenants via inbox" },
    ],
  },
  {
    group: "Subscription",
    permissions: [
      { action: "subscriptions:read", label: "View Subscription", desc: "View current plan and billing details" },
    ],
  },
  {
    group: "Payouts & Refunds",
    permissions: [
      { action: "refunds:read",   label: "View Payouts",    desc: "Access tenant refunds and credit balances" },
      { action: "refunds:update", label: "Process Payout",  desc: "Issue refunds and settle payouts" },
    ],
  },
  {
    group: "Staff Members",
    permissions: [
      { action: "staff:read",   label: "View Staff",     desc: "Browse staff profiles" },
      { action: "staff:create", label: "Add Staff",      desc: "Invite new staff members" },
      { action: "staff:delete", label: "Remove Staff",   desc: "Delete staff profiles" },
    ],
  },
  {
    group: "Custom Roles",
    permissions: [
      { action: "roles:read",   label: "View Roles",     desc: "Browse custom roles" },
      { action: "roles:create", label: "Create Roles",   desc: "Define new custom roles" },
      { action: "roles:delete", label: "Delete Roles",   desc: "Remove unused custom roles" },
    ],
  },
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
  const [showStaffPw, setShowStaffPw] = useState(false);
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

  const handleToggleAllPermissions = async (role: CustomRole, grantAll: boolean) => {
    try {
      const actions = grantAll
        ? PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.action))
        : [];
      await api.put(`/roles/${role.id}/permissions`, { actions });
      await fetchData();
    } catch {
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
      setCreatedStaff({ email, password });
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

  const handleCopyCredentials = () => {
    if (!createdStaff) return;
    navigator.clipboard.writeText(`Email: ${createdStaff.email}\nPassword: ${createdStaff.password}\nLogin URL: https://rentflaw.vercel.app/landlord/login`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <Label className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">Permissions Configuration</Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAllPermissions(role, true)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                          >
                            Select All (Super Admin)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAllPermissions(role, false)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded border border-border hover:bg-accent/40 text-muted-foreground transition-all cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {PERMISSION_GROUPS.map(grp => (
                          <div key={grp.group} className="space-y-1.5">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b pb-0.5">
                              {grp.group}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {grp.permissions.map(p => {
                                const hasPerm = role.permissions.some(rp => rp.action === p.action);
                                return (
                                  <button
                                    key={p.action}
                                    onClick={() => handleTogglePermission(role, p.action)}
                                    className={`flex items-start gap-2 p-2 rounded-sm text-left border transition-all cursor-pointer ${hasPerm ? "border-primary/30 bg-primary/5 text-primary" : "border-border hover:bg-accent/40"}`}
                                  >
                                    <div className="mt-0.5 flex-shrink-0">
                                      {hasPerm ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                                    </div>
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
              <div className="relative">
                <Input
                  id="staff-password"
                  type={showStaffPw ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={staffForm.password}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPw(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showStaffPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Credentials will be shown after saving for secure sharing.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Select Role</Label>
              <Select value={staffForm.role_id} onValueChange={v => { if (v) setStaffForm({ ...staffForm, role_id: v }); }}>
                <SelectTrigger>
                  {staffForm.role_id
                    ? <span className="flex flex-1 text-left truncate">{roles.find(r => r.id === staffForm.role_id)?.name ?? staffForm.role_id}</span>
                    : <SelectValue placeholder="Choose a role" />}
                </SelectTrigger>
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

      {/* Staff Credentials Modal */}
      <Dialog open={!!createdStaff} onOpenChange={() => setCreatedStaff(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" /> Staff Account Created
            </DialogTitle>
            <DialogDescription>Share these credentials securely. This dialog will not appear again.</DialogDescription>
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
                <span className="font-bold text-primary">/landlord/login</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">⚠️ Assign permissions to their role before they can access specific sections.</p>
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
    </DashboardLayout>
  );
}
