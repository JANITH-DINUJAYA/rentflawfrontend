"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Layers, PlusCircle, Search, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

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

  const handleArchive = async (id: string) => {
    setArchiving(true);
    try {
      await api.patch(`/floors/${id}/archive`);
      setArchiveId(null);
      await fetchFloors(selectedPropertyId);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to archive floor.");
      setArchiveId(null);
    } finally { setArchiving(false); }
  };

  const filtered = floors.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Floors Management</h2>
          <p className="text-sm text-muted-foreground">Manage floor levels inside your properties.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Add Floor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search floor name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={selectedPropertyId} onValueChange={v => { if (v) { setSelectedPropertyId(v); setFormPropertyId(v); } }}>
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder={propsLoading ? "Loading..." : "Select property"} />
          </SelectTrigger>
          <SelectContent>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
                    <TableHead>Floor Name</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                        No floors found. Add a floor to get started.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(floor => (
                    <TableRow key={floor.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">{floor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{floor.property?.name || "—"}</TableCell>
                      <TableCell className="text-sm font-semibold">{floor.rooms?.length || 0} rooms</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setArchiveId(floor.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Archive floor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                <SelectTrigger><SelectValue placeholder="Choose a property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
