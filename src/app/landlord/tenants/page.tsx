"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Users, PlusCircle, Search, Mail, Phone, Calendar, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyName: string;
  roomNumber: string;
  joinDate: string;
  status: "ACTIVE" | "INVITED" | "ENDED";
}

const SAMPLE_TENANTS: Tenant[] = [
  { id: "TNT-001", name: "Alice Vance", email: "alice@gmail.com", phone: "+1 (555) 019-2834", propertyName: "Greenwood Residence", roomNumber: "102", joinDate: "2026-01-01", status: "ACTIVE" },
  { id: "TNT-002", name: "Marcus Brody", email: "marcus.brody@univ.edu", phone: "+1 (555) 014-9988", propertyName: "City Center Hostels", roomNumber: "205", joinDate: "2026-03-15", status: "ACTIVE" },
  { id: "TNT-003", name: "David Miller", email: "david.miller@gmail.com", phone: "+1 (555) 012-7744", propertyName: "Greenwood Residence", roomNumber: "108", joinDate: "—", status: "INVITED" },
  { id: "TNT-004", name: "John Smith", email: "john.smith@gmail.com", phone: "+1 (555) 011-2233", propertyName: "Greenwood Residence", roomNumber: "101", joinDate: "2025-06-01", status: "ENDED" }
];

export default function TenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>(SAMPLE_TENANTS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [showInvite, setShowInvite] = React.useState(false);

  // Invite Form State
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    propertyName: "Greenwood Residence",
    roomNumber: ""
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const newTenant: Tenant = {
      id: `TNT-${String(tenants.length + 1).padStart(3, "0")}`,
      name: form.name,
      email: form.email,
      phone: form.phone || "—",
      propertyName: form.propertyName,
      roomNumber: form.roomNumber || "TBD",
      joinDate: "—",
      status: "INVITED"
    };

    setTenants([newTenant, ...tenants]);
    setShowInvite(false);
    setForm({ name: "", email: "", phone: "", propertyName: "Greenwood Residence", roomNumber: "" });
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants Directory</h2>
          <p className="text-sm text-muted-foreground">Manage active tenants, send invites to new occupants, and review lease links.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Invite Tenant
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenant name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "ACTIVE", "INVITED", "ENDED"] as const).map(status => {
            const count = status === "ALL" ? tenants.length : tenants.filter(t => t.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border text-muted-foreground hover:bg-accent/40"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Property & Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lease Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {tenant.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tenant.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{tenant.id}</p>
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
                      <p className="font-semibold">{tenant.propertyName}</p>
                      <p className="text-muted-foreground">Rm {tenant.roomNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tenant.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                        <UserCheck className="mr-1 h-3.5 w-3.5" /> Active
                      </Badge>
                    ) : tenant.status === "INVITED" ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold animate-pulse">
                        <Mail className="mr-1 h-3.5 w-3.5" /> Invited
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-none font-bold">
                        Ended
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {tenant.joinDate}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No tenants found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Tenant Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Invite New Tenant</DialogTitle>
            <DialogDescription>Send a login invitation link to register a tenant profile under your properties.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tenantName">Full Name</Label>
              <Input
                id="tenantName"
                placeholder="e.g. Alice Vance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenantEmail">Email Address</Label>
              <Input
                id="tenantEmail"
                type="email"
                placeholder="alice@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenantPhone">Phone Number (Optional)</Label>
              <Input
                id="tenantPhone"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="propertySelect">Target Property</Label>
                <Input
                  id="propertySelect"
                  value={form.propertyName}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roomUnit">Room / Unit</Label>
                <Input
                  id="roomUnit"
                  placeholder="e.g. 102"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p>Inviting this tenant will generate a registration code and dispatch an invitation email containing setup instructions.</p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Send Registration Invite
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
