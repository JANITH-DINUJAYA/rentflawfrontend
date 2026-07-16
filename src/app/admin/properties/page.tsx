"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Loader2, AlertCircle, Building, Archive, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  is_archived: boolean;
  landlord: {
    company_name: string | null;
    user: { first_name: string; last_name: string; email: string };
  };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [archiveTarget, setArchiveTarget] = useState<Property | null>(null);
  const [archivePending, setArchivePending] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/properties");
      setProperties(res.data);
    } catch {
      setError("Failed to load platform properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchivePending(true);
    setArchiveError("");
    try {
      await api.patch(`/properties/${archiveTarget.id}/archive`);
      setArchiveTarget(null);
      await fetchProperties();
    } catch (err: any) {
      setArchiveError(err.response?.data?.message || "Failed to archive property.");
    } finally {
      setArchivePending(false);
    }
  };

  const filtered = properties.filter(p =>
    `${p.name} ${p.address} ${p.landlord?.company_name || ""} ${p.landlord?.user?.first_name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Properties</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage all properties listed on the RentFlaw SaaS platform.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-background w-full sm:w-60">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            className="text-sm bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchProperties} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Landlord Owner</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {search ? `No properties matching "${search}"` : "No properties listed on the platform yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Building className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-semibold text-sm">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs uppercase font-semibold">{p.type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{p.landlord?.company_name || "Private Landlord"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.landlord?.user?.first_name} {p.landlord?.user?.last_name} ({p.landlord?.user?.email})
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.address}</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setArchiveTarget(p)}
                          className="p-1.5 rounded-lg border border-border hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-600 cursor-pointer transition-colors"
                          title="Archive property"
                        >
                          <Archive className="h-3.5 w-3.5" />
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

      {/* Archive Property Confirmation Dialog */}
      <Dialog open={archiveTarget !== null} onOpenChange={o => !o && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-yellow-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Archive Property
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>{archiveTarget?.name}</strong>?
              This will hide it from active dashboards. It cannot contain active lease agreements or pending utility/rent invoices.
            </DialogDescription>
          </DialogHeader>
          {archiveError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold leading-relaxed">
              ⚠️ {archiveError}
            </div>
          )}
          <DialogFooter className="gap-2">
            <button onClick={() => setArchiveTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={handleArchive} disabled={archivePending} className="px-4 py-2 text-sm font-bold rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {archivePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
