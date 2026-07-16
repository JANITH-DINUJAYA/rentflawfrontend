"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DoorOpen, PlusCircle, Search, Trash2, Home, Layers, Users, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  roomNumber: string;
  floorName: string;
  propertyName: string;
  type: "SINGLE" | "SHARED" | "SUITE";
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  capacity: number;
  occupantCount: number;
  hasActiveAgreement: boolean;
}

const SAMPLE_ROOMS: Room[] = [
  { id: "RM-001", roomNumber: "101", floorName: "1st Floor", propertyName: "Greenwood Residence", type: "SINGLE", status: "OCCUPIED", capacity: 1, occupantCount: 1, hasActiveAgreement: true },
  { id: "RM-002", roomNumber: "102", floorName: "1st Floor", propertyName: "Greenwood Residence", type: "SHARED", status: "OCCUPIED", capacity: 2, occupantCount: 1, hasActiveAgreement: true },
  { id: "RM-003", roomNumber: "201", floorName: "2nd Floor", propertyName: "Greenwood Residence", type: "SUITE", status: "VACANT", capacity: 2, occupantCount: 0, hasActiveAgreement: false },
  { id: "RM-004", roomNumber: "205", floorName: "Ground Floor", propertyName: "City Center Hostels", type: "SHARED", status: "OCCUPIED", capacity: 4, occupantCount: 3, hasActiveAgreement: true },
  { id: "RM-005", roomNumber: "302", floorName: "1st Floor", propertyName: "City Center Hostels", type: "SINGLE", status: "MAINTENANCE", capacity: 1, occupantCount: 0, hasActiveAgreement: false }
];

export default function RoomsPage() {
  const [rooms, setRooms] = React.useState<Room[]>(SAMPLE_ROOMS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [showAdd, setShowAdd] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Form State
  const [form, setForm] = React.useState({
    roomNumber: "",
    propertyName: "Greenwood Residence",
    floorName: "1st Floor",
    type: "SINGLE" as Room["type"],
    capacity: "1"
  });

  const handleAdd = () => {
    if (!form.roomNumber.trim()) return;
    const newRoom: Room = {
      id: `RM-${String(rooms.length + 1).padStart(3, "0")}`,
      roomNumber: form.roomNumber,
      floorName: form.floorName,
      propertyName: form.propertyName,
      type: form.type,
      status: "VACANT",
      capacity: parseInt(form.capacity) || 1,
      occupantCount: 0,
      hasActiveAgreement: false
    };
    setRooms([...rooms, newRoom]);
    setShowAdd(false);
    setForm({ roomNumber: "", propertyName: "Greenwood Residence", floorName: "1st Floor", type: "SINGLE", capacity: "1" });
  };

  const handleArchive = (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (room?.hasActiveAgreement) {
      setErrorMsg("Cannot archive room because it is linked to an active rental agreement.");
      return;
    }
    setRooms(rooms.filter(r => r.id !== id));
  };

  const filtered = rooms.filter(r => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = propertyFilter === "ALL" || r.propertyName === propertyFilter;
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  const uniqueProperties = Array.from(new Set(rooms.map(r => r.propertyName)));
  const floorsForSelectedProperty = Array.from(new Set(rooms.filter(r => r.propertyName === form.propertyName).map(r => r.floorName)));

  // Occupancy Stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === "OCCUPIED").length;
  const vacantRooms = rooms.filter(r => r.status === "VACANT").length;
  const maintenanceRooms = rooms.filter(r => r.status === "MAINTENANCE").length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rooms Management</h2>
          <p className="text-sm text-muted-foreground">Monitor vacancy rates, manage capacity settings, and configure room specifications.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Occupancy Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms", value: totalRooms, color: "text-primary bg-primary/10" },
          { label: "Occupied Rooms", value: occupiedRooms, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Vacant Rooms", value: vacantRooms, color: "text-sky-500 bg-sky-500/10" },
          { label: "Maintenance", value: maintenanceRooms, color: "text-amber-500 bg-amber-500/10" }
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <DoorOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Room Number..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={propertyFilter} onValueChange={(v) => v && setPropertyFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Properties</SelectItem>
            {uniqueProperties.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="VACANT">Vacant</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Message Dialog */}
      {errorMsg && (
        <Dialog open={!!errorMsg} onOpenChange={() => setErrorMsg(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Action Blocked
              </DialogTitle>
              <DialogDescription className="pt-2">{errorMsg}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setErrorMsg(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-card border border-border text-foreground hover:bg-accent"
              >
                Dismiss
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rooms Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor & Property</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((room) => (
                <TableRow key={room.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell className="font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span>{room.roomNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold border-none bg-accent/60 text-foreground">
                      {room.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-semibold flex items-center gap-1">
                        <Layers className="h-3 w-3 text-muted-foreground" /> {room.floorName}
                      </p>
                      <p className="text-muted-foreground">{room.propertyName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{room.occupantCount} / {room.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {room.status === "OCCUPIED" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">Occupied</Badge>
                    ) : room.status === "VACANT" ? (
                      <Badge className="bg-sky-500/10 text-sky-500 border-none font-bold">Vacant</Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold">Maintenance</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleArchive(room.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Archive Room"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No rooms matching conditions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Room Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a rental unit specifying its capacity and type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="propertyName">Property</Label>
                <Select value={form.propertyName} onValueChange={(v) => v && setForm({ ...form, propertyName: v })}>
                  <SelectTrigger id="propertyName"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {uniqueProperties.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floorName">Floor</Label>
                <Select value={form.floorName} onValueChange={(v) => v && setForm({ ...form, floorName: v })}>
                  <SelectTrigger id="floorName"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {floorsForSelectedProperty.length > 0 ? (
                      floorsForSelectedProperty.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="1st Floor">1st Floor</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g. 305"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as any })}>
                  <SelectTrigger id="roomType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single</SelectItem>
                    <SelectItem value="SHARED">Shared</SelectItem>
                    <SelectItem value="SUITE">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity Limit</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!form.roomNumber.trim()}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Create Room
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
