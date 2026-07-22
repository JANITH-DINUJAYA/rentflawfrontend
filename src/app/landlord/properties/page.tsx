"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Building, 
  MapPin, 
  Trash2, 
  Plus, 
  AlertTriangle,
  Loader2,
  AlertCircle,
  Pencil,
  CheckSquare,
  Square,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

type PropertyType = "APARTMENT" | "BOARDING_HOUSE" | "HOSTEL" | "RENTAL_HOUSE";

interface BackendProperty {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  floors?: { rooms?: any[] }[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<BackendProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<PropertyType>("APARTMENT");
  const [formError, setFormError] = useState("");

  // Edit states
  const [editingProperty, setEditingProperty] = useState<BackendProperty | null>(null);

  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);

  // TableExportControls states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/properties");
      setProperties(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load properties. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !address.trim()) {
      setFormError("All fields are required");
      return;
    }

    setCreateLoading(true);
    try {
      await api.post("/properties", {
        name: name.trim(),
        address: address.trim(),
        type,
      });
      setDialogOpen(false);
      setName("");
      setAddress("");
      setType("APARTMENT");
      await fetchProperties();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to create property. Check your limits.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setCreateLoading(true);
    setFormError("");
    try {
      await api.patch(`/properties/${editingProperty.id}`, {
        name: name.trim(),
        address: address.trim(),
        type,
      });
      setEditingProperty(null);
      setName("");
      setAddress("");
      setType("APARTMENT");
      await fetchProperties();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to update property.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleArchiveProperty = async (id: string) => {
    setArchiveLoading(true);
    try {
      await api.patch(`/properties/${id}/archive`);
      setConfirmArchiveId(null);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      await fetchProperties();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot archive property.");
      setConfirmArchiveId(null);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to archive the ${selectedIds.length} selected properties?`)) return;
    setBulkArchiving(true);
    try {
      await api.post('/properties/bulk-archive', { ids: selectedIds });
      setSelectedIds([]);
      await fetchProperties();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to bulk archive selected properties.");
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredProps: BackendProperty[]) => {
    const filteredIds = filteredProps.map(p => p.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handlePrintProperty = (p: any) => {
    const typeLabel = getReadableType(p.type);
    let roomsHtml = '';
    if (p.floors && p.floors.length > 0) {
      roomsHtml += `
        <h2 style="margin-top:20px;border-bottom:1px solid #e5e7eb;padding-bottom:6px">Rooms and Units List</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:10px">
          <thead>
            <tr style="background:#f3f4f6;text-align:left">
              <th style="padding:8px;font-size:11px;font-weight:700;color:#374151">Floor</th>
              <th style="padding:8px;font-size:11px;font-weight:700;color:#374151">Room Number</th>
              <th style="padding:8px;font-size:11px;font-weight:700;color:#374151">Rent Price</th>
              <th style="padding:8px;font-size:11px;font-weight:700;color:#374151">Capacity</th>
              <th style="padding:8px;font-size:11px;font-weight:700;color:#374151">Type</th>
            </tr>
          </thead>
          <tbody>
      `;
      p.floors.forEach((f: any) => {
        if (f.rooms && f.rooms.length > 0) {
          f.rooms.forEach((r: any) => {
            roomsHtml += `
              <tr style="border-bottom:1px solid #e5e7eb">
                <td style="padding:8px;font-size:12px;color:#4b5563">${f.name}</td>
                <td style="padding:8px;font-size:12px;color:#111827;font-weight:600">Room ${r.room_number}</td>
                <td style="padding:8px;font-size:12px;color:#111827;font-weight:600">Rs ${Number(r.base_rent).toFixed(2)}</td>
                <td style="padding:8px;font-size:12px;color:#4b5563">${r.capacity} beds</td>
                <td style="padding:8px;font-size:12px;color:#4b5563;text-transform:uppercase">${r.occupancy_type || '—'}</td>
              </tr>
            `;
          });
        }
      });
      roomsHtml += `
          </tbody>
        </table>
      `;
    }

    const html = `
      <html>
        <head>
          <title>Property Details - ${p.name}</title>
          <style>
            body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;padding:40px;margin:0}
            .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e5e7eb;padding-bottom:15px;margin-bottom:25px}
            .brand{font-size:22px;font-weight:900;color:#4f46e5}
            .brand span{font-size:12px;font-weight:500;color:#6b7280;display:block;margin-top:2px}
            .badge{padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;background:#e0e7ff;color:#4f46e5}
            h2{font-size:15px;font-weight:700;color:#4f46e5;margin:15px 0 8px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:8px}
            .field label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}
            .field p{font-size:13px;color:#111827;font-weight:600;margin-top:2px}
            .footer{margin-top:50px;padding-top:15px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}
            @media print{body{padding:20px}}
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">RentFlaw<span>Property Details Overview</span></div>
            <div class="badge">${typeLabel}</div>
          </div>
          <h2>Property Info</h2>
          <div class="grid">
            <div class="field"><label>Property Name</label><p>${p.name}</p></div>
            <div class="field"><label>Full Address</label><p>${p.address}</p></div>
            <div class="field"><label>Property Type</label><p>${typeLabel}</p></div>
          </div>
          ${roomsHtml}
          <div class="footer">RentFlaw &mdash; Global Rental Management SaaS &nbsp;&bull;&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
          <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}<\/script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) { alert("Popup blocked — please allow popups for this site."); return; }
    w.document.write(html);
    w.document.close();
  };

  // Helper helper to format backend enum type to readable label
  const getReadableType = (t: PropertyType) => {
    switch (t) {
      case "BOARDING_HOUSE": return "Co-Living / Boarding House";
      case "RENTAL_HOUSE": return "Rental House";
      case "APARTMENT": return "Apartment Building";
      case "HOSTEL": return "Hostel";
      default: return t;
    }
  };

  // Filter and Search logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const propertyColumns = [
    { key: "name", label: "Property Name" },
    { key: "type", label: "Type" },
    { key: "address", label: "Address" },
  ];

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setName("");
    setAddress("");
    setType("APARTMENT");
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: BackendProperty) => {
    setEditingProperty(p);
    setName(p.name);
    setAddress(p.address);
    setType(p.type);
  };

  return (
    <DashboardLayout>
      {/* ─── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
          <p className="text-sm text-muted-foreground">Manage your physical buildings, layout structures, and room configurations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/10 transition-all duration-200 cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Property
        </button>
      </div>

      {/* ─── Table Controls ─── */}
      <div className="mt-6">
        <TableExportControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search properties by name or address..."
          filterValue={filterType}
          onFilterChange={setFilterType}
          filterLabel="All Property Types"
          filterOptions={[
            { label: "Apartment Building", value: "APARTMENT" },
            { label: "Co-Living / Boarding", value: "BOARDING_HOUSE" },
            { label: "Hostel", value: "HOSTEL" },
            { label: "Rental House", value: "RENTAL_HOUSE" },
          ]}
          tableData={filteredProperties}
          columns={propertyColumns}
          filename="properties_report"
          title="Properties Report"
        />
      </div>

      {/* ─── Bulk Actions Header ─── */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-destructive">
            {selectedIds.length} properties selected
          </span>
          <button
            onClick={handleBulkArchive}
            disabled={bulkArchiving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-white rounded-lg text-xs font-bold hover:bg-destructive/90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {bulkArchiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Archive Selected
          </button>
        </div>
      )}

      {/* ─── Properties Grid ────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching property records...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchProperties} className="text-primary hover:underline text-xs mt-2">
            Try again
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Building className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold">No properties found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Try adjusting your filters or add a new property building.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <button
              onClick={() => handleToggleSelectAll(filteredProperties)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              {filteredProperties.every(id => selectedIds.includes(id.id)) ? (
                <CheckSquare className="h-4.5 w-4.5 text-primary" />
              ) : (
                <Square className="h-4.5 w-4.5" />
              )}
              Select All Shown
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((p) => {
              const floorsCount = p.floors?.length || 0;
              const roomsCount = p.floors?.reduce((sum, f) => sum + (f.rooms?.length || 0), 0) || 0;
              const isSelected = selectedIds.includes(p.id);

              return (
                <Card key={p.id} className={`hover:shadow-md transition-all duration-300 relative overflow-hidden group border ${
                  isSelected ? "border-primary ring-1 ring-primary/20" : ""
                }`}>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />

                  {/* Checkbox selector */}
                  <button
                    onClick={() => handleToggleSelect(p.id)}
                    className="absolute top-3.5 right-3.5 z-10 p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 opacity-60 hover:opacity-100" />}
                  </button>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between pr-6">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-[10px] uppercase font-bold tracking-wider">
                          {getReadableType(p.type)}
                        </Badge>
                        <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Building className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-6">
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{p.address}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-accent/20 p-3 rounded-xl text-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Floors</p>
                        <p className="text-lg font-extrabold">{floorsCount}</p>
                      </div>
                      <div className="border-l border-border">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Rooms</p>
                        <p className="text-lg font-extrabold">{roomsCount}</p>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {p.id.slice(0, 8)}...
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePrintProperty(p)}
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          title="Print Property"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          title="Edit Property"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmArchiveId(p.id)}
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Archive Property"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Add / Edit Property Dialog ────────────────────── */}
      <Dialog open={dialogOpen || !!editingProperty} onOpenChange={() => { setDialogOpen(false); setEditingProperty(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
            <DialogDescription>
              {editingProperty ? "Update the property profile details below." : "Create a new physical property profile. You can later add floors and rooms to this building."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingProperty ? handleEditProperty : handleCreateProperty} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                placeholder="e.g. Greenwood Apartments"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                placeholder="e.g. 124 Park Ave, New York, NY"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Property Type</Label>
              <Select value={type} onValueChange={v => { if (v) setType(v as PropertyType); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APARTMENT">Apartment Building</SelectItem>
                  <SelectItem value="BOARDING_HOUSE">Co-Living / Boarding House</SelectItem>
                  <SelectItem value="HOSTEL">Hostel</SelectItem>
                  <SelectItem value="RENTAL_HOUSE">Rental House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => { setDialogOpen(false); setEditingProperty(null); }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingProperty ? "Save Changes" : "Create Property"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Archive Confirmation Dialog ─────────────── */}
      <Dialog open={confirmArchiveId !== null} onOpenChange={(open) => !open && setConfirmArchiveId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Confirm Archive</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to archive this property? This action soft-deletes the property profile and hides it from search results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-2">
            <button
              onClick={() => setConfirmArchiveId(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200 cursor-pointer"
            >
              No, Keep It
            </button>
            <button
              onClick={() => confirmArchiveId && handleArchiveProperty(confirmArchiveId)}
              disabled={archiveLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 shadow-md shadow-destructive/10 transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {archiveLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Yes, Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
