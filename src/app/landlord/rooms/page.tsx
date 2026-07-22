"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoorOpen, PlusCircle, Search, Trash2, Loader2, AlertCircle, Info, Pencil, CheckSquare, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TableExportControls } from "@/components/table-export-controls";

type OccupancyType = "SINGLE" | "SHARED" | "STUDIO";

interface Floor { id: string; name: string; property?: { name: string }; }
interface Room {
  id: string;
  room_number: string;
  occupancy_type: OccupancyType;
  capacity: number;
  base_rent: number;
  floor: { id: string; name: string; property?: { name: string } };
}

const emptyForm = { floor_id: "", room_number: "", occupancy_type: "SINGLE" as OccupancyType, capacity: "1", base_rent: "" };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  // Edit Room states
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const [roomsRes, propsRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/properties"),
      ]);
      setRooms(roomsRes.data);
      // Load floors across all properties
      const allFloors: Floor[] = [];
      for (const prop of propsRes.data) {
        try {
          const fRes = await api.get(`/floors?property_id=${prop.id}`);
          allFloors.push(...fRes.data.map((f: any) => ({ ...f, property: { name: prop.name } })));
        } catch {}
      }
      setFloors(allFloors);
      if (allFloors.length > 0 && !form.floor_id) setForm(f => ({ ...f, floor_id: allFloors[0].id }));
    } catch { setError("Failed to load rooms."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.floor_id || !form.room_number.trim() || !form.base_rent) { setFormError("All required fields must be filled."); return; }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/rooms", {
        floor_id: form.floor_id,
        room_number: form.room_number.trim(),
        occupancy_type: form.occupancy_type,
        capacity: parseInt(form.capacity) || 1,
        base_rent: parseFloat(form.base_rent),
      });
      setShowAdd(false);
      setForm(emptyForm);
      await fetchRooms();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to create room.");
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !form.room_number.trim() || !form.base_rent) return;
    setSaving(true);
    setFormError("");
    try {
      await api.patch(`/rooms/${editingRoom.id}`, {
        room_number: form.room_number.trim(),
        occupancy_type: form.occupancy_type,
        capacity: parseInt(form.capacity) || 1,
        base_rent: parseFloat(form.base_rent),
      });
      setEditingRoom(null);
      setForm(emptyForm);
      await fetchRooms();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to edit room.");
    } finally { setSaving(false); }
  };

  const handleArchive = async (id: string) => {
    setArchiving(true);
    try {
      await api.patch(`/rooms/${id}/archive`);
      setArchiveId(null);
      setSelectedIds(prev => prev.filter(x => x !== id));
      await fetchRooms();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Cannot archive room.");
      setArchiveId(null);
    } finally { setArchiving(false); }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to archive the ${selectedIds.length} selected rooms?`)) return;
    setBulkArchiving(true);
    try {
      await api.post("/rooms/bulk-archive", { ids: selectedIds });
      setSelectedIds([]);
      await fetchRooms();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to bulk archive rooms.");
    } finally {
      setBulkArchiving(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (filteredRooms: Room[]) => {
    const filteredIds = filteredRooms.map(r => r.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const occupancyColors: Record<OccupancyType, string> = {
    SINGLE: "bg-blue-500/10 text-blue-600",
    SHARED: "bg-purple-500/10 text-purple-600",
    STUDIO: "bg-green-500/10 text-green-600",
  };

  const filtered = rooms.filter(r =>
    r.room_number.toLowerCase().includes(search.toLowerCase()) ||
    r.floor?.property?.name?.toLowerCase().includes(search.toLowerCase()) || ""
  );

  const roomColumns = [
    { key: "room_number", label: "Room No." },
    { key: "floor_name", label: "Floor" },
    { key: "property_name", label: "Property" },
    { key: "occupancy_type", label: "Type" },
    { key: "capacity", label: "Capacity" },
    { key: "base_rent", label: "Base Rent" },
  ];

  const exportData = filtered.map(r => ({
    room_number: r.room_number,
    floor_name: r.floor?.name || "",
    property_name: r.floor?.property?.name || "",
    occupancy_type: r.occupancy_type,
    capacity: r.capacity.toString(),
    base_rent: `$${Number(r.base_rent).toFixed(2)}`,
  }));

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    if (floors.length > 0) setForm(f => ({ ...f, floor_id: floors[0].id }));
    setShowAdd(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      floor_id: room.floor.id,
      room_number: room.room_number,
      occupancy_type: room.occupancy_type,
      capacity: room.capacity.toString(),
      base_rent: room.base_rent.toString(),
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rooms Management</h2>
          <p className="text-sm text-muted-foreground">Manage individual rooms across all your floors and properties.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Table Export Controls */}
      <div className="mt-6">
        <TableExportControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search rooms..."
          tableData={exportData}
          columns={roomColumns}
          filename="rooms_report"
          title="Rooms Report"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl mb-4">
          <span className="text-xs font-bold text-destructive">
            {selectedIds.length} rooms selected
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
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchRooms} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
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
                  <TableHead>Room No.</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Base Rent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      {search ? `No rooms matching "${search}"` : "No rooms yet. Add floors first, then add rooms."}
                    </TableCell>
                  </TableRow>
                ) : filtered.map(room => {
                  const isSelected = selectedIds.includes(room.id);
                  return (
                    <TableRow key={room.id} className={`hover:bg-accent/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleSelect(room.id)}
                          className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-primary" />
                          <span className="font-bold text-sm">{room.room_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{room.floor?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{room.floor?.property?.name || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${occupancyColors[room.occupancy_type]}`}>
                        {room.occupancy_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{room.capacity}</TableCell>
                    <TableCell className="text-sm font-semibold">Rs {Number(room.base_rent).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          title="Edit room"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setArchiveId(room.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Archive room"
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
          </CardContent>
        </Card>
      )}

      {/* Add Room Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a room inside one of your existing floors.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            {formError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="space-y-1.5">
              <Label>Select Floor</Label>
              <Select value={form.floor_id} onValueChange={v => { if (v) setForm(f => ({ ...f, floor_id: v })); }}>
                <SelectTrigger>
                  {form.floor_id
                    ? <span className="flex flex-1 text-left truncate">{(() => { const fl = floors.find(f => f.id === form.floor_id); return fl ? `${fl.property?.name || ""} / ${fl.name}` : form.floor_id; })()}</span>
                    : <SelectValue placeholder="Choose floor" />}
                </SelectTrigger>
                <SelectContent>
                  {floors.length === 0 ? (
                    <SelectItem value="_none" disabled>No floors available — create one first</SelectItem>
                  ) : floors.map(fl => (
                    <SelectItem key={fl.id} value={fl.id}>{`${fl.property?.name || ""} / ${fl.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room-number">Room Number</Label>
                <Input id="room-number" placeholder="e.g. 101, A1" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Occupancy Type</Label>
                <Select value={form.occupancy_type} onValueChange={v => { if (v) setForm(f => ({ ...f, occupancy_type: v as OccupancyType })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="SHARED">Shared</SelectItem>
                    <SelectItem value="STUDIO">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="base-rent">Base Rent ($)</Label>
                <Input id="base-rent" type="number" min="0" step="0.01" placeholder="500.00" value={form.base_rent} onChange={e => setForm(f => ({ ...f, base_rent: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Room
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Room Details</DialogTitle>
            <DialogDescription>Update configuration and pricing for Room {editingRoom?.room_number}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            {formError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="space-y-1.5">
              <Label>Floor / Property</Label>
              <Input value={editingRoom ? `${editingRoom.floor?.property?.name || ""} / ${editingRoom.floor?.name || ""}` : ""} disabled className="bg-accent/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-room-number">Room Number</Label>
                <Input id="edit-room-number" placeholder="e.g. 101, A1" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Occupancy Type</Label>
                <Select value={form.occupancy_type} onValueChange={v => { if (v) setForm(f => ({ ...f, occupancy_type: v as OccupancyType })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="SHARED">Shared</SelectItem>
                    <SelectItem value="STUDIO">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input id="edit-capacity" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-base-rent">Base Rent ($)</Label>
                <Input id="edit-base-rent" type="number" min="0" step="0.01" placeholder="500.00" value={form.base_rent} onChange={e => setForm(f => ({ ...f, base_rent: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setEditingRoom(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
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
            <DialogTitle>Archive this room?</DialogTitle>
            <DialogDescription>This will soft-delete the room. It cannot be archived if a tenant has an active agreement here.</DialogDescription>
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
