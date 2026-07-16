"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Edit2, ShieldAlert, CheckCircle2, UserX } from "lucide-react";

interface Landlord {
  id: string;
  name: string;
  email: string;
  subscriptionTier: "STARTER" | "PRO" | "ENTERPRISE";
  propertiesCount: number;
  tenantsCount: number;
  status: "ACTIVE" | "SUSPENDED";
  joinedDate: string;
}

const SAMPLE_LANDLORDS: Landlord[] = [
  { id: "LL-001", name: "Greenwood Rentals", email: "info@greenwoodrent.com", subscriptionTier: "ENTERPRISE", propertiesCount: 8, tenantsCount: 45, status: "ACTIVE", joinedDate: "2026-01-15" },
  { id: "LL-002", name: "Apex Properties Ltd", email: "billing@apexprop.com", subscriptionTier: "PRO", propertiesCount: 4, tenantsCount: 18, status: "ACTIVE", joinedDate: "2026-03-01" },
  { id: "LL-003", name: "John Doe (Individual)", email: "john.doe@gmail.com", subscriptionTier: "STARTER", propertiesCount: 1, tenantsCount: 3, status: "ACTIVE", joinedDate: "2026-04-12" },
  { id: "LL-004", name: "Summit Estates", email: "summit@estate.com", subscriptionTier: "PRO", propertiesCount: 6, tenantsCount: 22, status: "SUSPENDED", joinedDate: "2025-11-20" }
];

export default function LandlordsManagementPage() {
  const [landlords, setLandlords] = React.useState<Landlord[]>(SAMPLE_LANDLORDS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [selectedLandlord, setSelectedLandlord] = React.useState<Landlord | null>(null);
  
  // Edit Dialog Form state
  const [form, setForm] = React.useState({
    subscriptionTier: "STARTER" as Landlord["subscriptionTier"],
    status: "ACTIVE" as Landlord["status"]
  });

  const handleUpdate = () => {
    if (!selectedLandlord) return;
    setLandlords(landlords.map(l => 
      l.id === selectedLandlord.id 
        ? { ...l, subscriptionTier: form.subscriptionTier, status: form.status }
        : l
    ));
    setSelectedLandlord(null);
  };

  const filtered = landlords.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "ALL" || l.subscriptionTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Landlords Registry</h2>
          <p className="text-sm text-muted-foreground">Monitor platform registration levels, manage tenant allocation spaces, and update subscription packages.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landlord name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={tierFilter} onValueChange={(v) => v && setTierFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Pricing Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Pricing Tiers</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Subscription Tier</TableHead>
                <TableHead>Resource Counts</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ll) => (
                <TableRow key={ll.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {ll.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{ll.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{ll.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-bold border-none uppercase ${
                      ll.subscriptionTier === "ENTERPRISE" ? "bg-amber-500/10 text-amber-500" :
                      ll.subscriptionTier === "PRO" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {ll.subscriptionTier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-foreground">{ll.propertiesCount} Properties</p>
                      <p className="text-muted-foreground">{ll.tenantsCount} Tenants</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ll.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border-none font-bold">
                        <UserX className="mr-1 h-3.5 w-3.5" /> Suspended
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ll.joinedDate}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => {
                        setSelectedLandlord(ll);
                        setForm({ subscriptionTier: ll.subscriptionTier, status: ll.status });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Manage
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No landlords found matching query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Manage Landlord Subscription Dialog */}
      <Dialog open={selectedLandlord !== null} onOpenChange={open => !open && setSelectedLandlord(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Manage Landlord Account</DialogTitle>
            <DialogDescription>Modify active service pricing parameters and deactivation codes.</DialogDescription>
          </DialogHeader>
          {selectedLandlord && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl border border-border bg-accent/20 text-xs">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Selected Landlord</p>
                <p className="font-bold text-sm">{selectedLandlord.name}</p>
                <p className="text-muted-foreground">{selectedLandlord.email}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subscriptionSelect">Billing & Limits Package</Label>
                <Select value={form.subscriptionTier} onValueChange={(v) => v && setForm({ ...form, subscriptionTier: v as any })}>
                  <SelectTrigger id="subscriptionSelect"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">Starter Pack (Free)</SelectItem>
                    <SelectItem value="PRO">Pro Pack ($29/mo)</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise ($79/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statusSelect">Account Control State</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v as any })}>
                  <SelectTrigger id="statusSelect"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Authorized (Active)</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended (Blocked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10px] text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>Updating pricing plans will alter tenant/property capacity restrictions immediately. Blocking locks landlord dashboard access.</p>
              </div>
              <button
                onClick={handleUpdate}
                className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Apply Administrative Adjustments
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
