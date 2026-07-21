"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Layers, PlusCircle, Search, Trash2, Loader2, AlertCircle, Pencil, CheckSquare, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

interface Property { id: string; name: string; }
interface Floor { id: string; name: string; property: { id: string; name: string }; rooms: any[]; }

export default function FloorsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [propsLoading, setPropsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPropertyId, setFormPropertyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  // Edit Floor states
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Load properties
  useEffect(() => {
    (async () => {
      setPropsLoading(true);
      try {
        const res = await api.get("/properties");
        setProperties(res.data);
        if (res.data.length > 0) {
          setSelectedPropertyId(res.data[0].id);
          setFormPropertyId(res.data[0].id);
        }
      } catch { setError("Failed to load properties."); }
      finally { setPropsLoading(false); }
    })();
  }, []);

  // Load floors when property changes
  const fetchFloors = async (propertyId: string) => {
    if (!propertyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/floors?property_id=${propertyId}`);
      setFloors(res.data);
    } catch { setError("Failed to load floors."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedPropertyId) fetchFloors(selectedPropertyId);
  }, [selectedPropertyId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPropertyId) { setFormError("All fields are required."); return; }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/floors", { property_id: formPropertyId, name: formName.trim() });
      setShowAdd(false);
      setFormName("");
      if (formPropertyId === selectedPropertyId) await fetchFloors(selectedPropertyId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to add floor.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !formName.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      await api.patch(`/floors/${editingFloor.id}`, { name: formName.trim() });
      setEditingFloor(null);
      setFormName("");
      await fetchFloors(selectedPropertyId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to edit floor.");
    } finally { setSaving(false); }
  };

  const handleArchive = async (id: string) => {
    setArchiving(true);
    try {
      await api.patch(`/floors/${id}/archive`);
      setArchiveId(null);
      setSelectedIds(prev => prev.filter(x => x !== id));
      await fetchFloors(selectedPropertyId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to archive floor.");
      setArchiveId(null);
    } finally { setArchiving(false); }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to archive the ${selectedIds.length} selected floors?`)) return;
    setBulkArchiving(true);
    try {
      await api.post("/floors/bulk-archive", { ids: selectedIds });
      setSelectedIds([]);
      await fetchFloors(selectedPropertyId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to bulk archive floors.");
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredFloors: Floor[]) => {
    const filteredIds = filteredFloors.map(f => f.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const filtered = floors.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const floorColumns = [
    { key: "name", label: "Floor Name" },
    { key: "property_name", label: "Property" },
    { key: "rooms_count", label: "Rooms Count" },
  ];

  const exportData = filtered.map(f => ({
    name: f.name,
    property_name: f.property?.name || "",
    rooms_count: `${f.rooms?.length || 0} rooms`,
  }));

  const handleOpenAdd = () => {
    setEditingFloor(null);
    setFormName("");
    setShowAdd(true);
  };

  const handleOpenEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setFormName(floor.name);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Floors Management</h2>
          <p className="text-sm text-muted-foreground">Manage floor levels inside your properties.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Add Floor
        </button>
      </div>

      {/* Select Property Header Filter */}
      <div className="mt-6 p-4 bg-accent/5 border border-border/60 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <Label className="text-xs font-bold text-muted-foreground">Active Property:</Label>
        <Select value={selectedPropertyId} onValueChange={v => { if (v) { setSelectedPropertyId(v); setFormPropertyId(v); } }}>
          <SelectTrigger className="w-full sm:w-64 h-9 text-xs">
            {selectedPropertyId
              ? <span className="flex flex-1 text-left truncate">{properties.find(p => p.id === selectedPropertyId)?.name ?? selectedPropertyId}</span>
              : <SelectValue placeholder={propsLoading ? "Loading..." : "Select property"} />}
          </SelectTrigger>
          <SelectContent>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{`${p.name}`}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table Export Controls */}
      <div className="mt-4">
        <TableExportControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search floor levels..."
          tableData={exportData}
          columns={floorColumns}
          filename="floors_report"
          title="Floors Report"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-4">
          <span className="text-xs font-bold text-destructive">
            {selectedIds.length} floors selected
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

      {/* Table */}
      {propsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No properties yet</p>
          <p className="text-sm text-muted-foreground">Create a property first before adding floors.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            ) : error ? (
              <div className="flex flex-col items-center py-12 gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <button
                        onClick={() => handleToggleSelectAll(filtered)}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {filtered.length > 0 && filtered.every(id => selectedIds.includes(id.id)) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Floor Name</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                        No floors found. Add a floor to get started.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(floor => {
                    const isSelected = selectedIds.includes(floor.id);
                    return (
                      <TableRow key={floor.id} className={`hover:bg-accent/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleSelect(floor.id)}
                            className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">{floor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{floor.property?.name || "—"}</TableCell>
                        <TableCell className="text-sm font-semibold">{floor.rooms?.length || 0} rooms</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(floor)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                              title="Edit floor"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setArchiveId(floor.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Archive floor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Floor Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Floor</DialogTitle>
            <DialogDescription>Add a floor level to one of your properties.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            {formError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="space-y-1.5">
              <Label>Select Property</Label>
              <Select value={formPropertyId} onValueChange={v => { if (v) setFormPropertyId(v); }}>
                <SelectTrigger>
                  {formPropertyId
                    ? <span className="flex flex-1 text-left truncate">{properties.find(p => p.id === formPropertyId)?.name ?? formPropertyId}</span>
                    : <SelectValue placeholder="Choose a property" />}
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{`${p.name}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor-name">Floor Name</Label>
              <Input id="floor-name" placeholder="e.g. Ground Floor, 1st Floor" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Floor
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Floor Dialog */}
      <Dialog open={!!editingFloor} onOpenChange={() => setEditingFloor(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Floor Name</DialogTitle>
            <DialogDescription>Update the name of this floor level.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            {formError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="space-y-1.5">
              <Label>Property</Label>
              <Input value={editingFloor?.property?.name || ""} disabled className="bg-accent/10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-floor-name">Floor Name</Label>
              <Input id="edit-floor-name" placeholder="e.g. Ground Floor, 1st Floor" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setEditingFloor(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <Dialog open={archiveId !== null} onOpenChange={o => !o && setArchiveId(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Archive this floor?</DialogTitle>
            <DialogDescription>This will soft-delete the floor and hide it. Rooms in this floor must have no active agreements.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setArchiveId(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={() => archiveId && handleArchive(archiveId)} disabled={archiving} className="px-4 py-2 text-sm font-bold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {archiving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
