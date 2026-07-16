"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Layers, PlusCircle, Search, Trash2, Building, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Floor {
  id: string;
  name: string;
  propertyName: string;
  roomCount: number;
  isArchived: boolean;
}

const SAMPLE_FLOORS: Floor[] = [
  { id: "FL-001", name: "1st Floor", propertyName: "Greenwood Residence", roomCount: 8, isArchived: false },
  { id: "FL-002", name: "2nd Floor", propertyName: "Greenwood Residence", roomCount: 8, isArchived: false },
  { id: "FL-003", name: "3rd Floor", propertyName: "Greenwood Residence", roomCount: 6, isArchived: false },
  { id: "FL-004", name: "Ground Floor", propertyName: "City Center Hostels", roomCount: 12, isArchived: false },
  { id: "FL-005", name: "1st Floor", propertyName: "City Center Hostels", roomCount: 12, isArchived: false },
];

export default function FloorsPage() {
  const [floors, setFloors] = React.useState<Floor[]>(SAMPLE_FLOORS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [propertyFilter, setPropertyFilter] = React.useState<string>("ALL");
  const [showAdd, setShowAdd] = React.useState(false);

  // Form State
  const [form, setForm] = React.useState({
    name: "",
    propertyName: "Greenwood Residence"
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newFloor: Floor = {
      id: `FL-${String(floors.length + 1).padStart(3, "0")}`,
      name: form.name,
      propertyName: form.propertyName,
      roomCount: 0,
      isArchived: false
    };
    setFloors([...floors, newFloor]);
    setShowAdd(false);
    setForm({ name: "", propertyName: "Greenwood Residence" });
  };

  const handleArchive = (id: string) => {
    setFloors(floors.map(f => f.id === id ? { ...f, isArchived: true } : f));
  };

  const filtered = floors.filter(f => {
    if (f.isArchived) return false;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProperty = propertyFilter === "ALL" || f.propertyName === propertyFilter;
    return matchesSearch && matchesProperty;
  });

  const uniqueProperties = Array.from(new Set(floors.map(f => f.propertyName)));

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Floors Management</h2>
          <p className="text-sm text-muted-foreground">Manage organizational floor layers inside your properties.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> Add Floor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by floor name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={propertyFilter} onValueChange={(v) => v && setPropertyFilter(v)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Properties</SelectItem>
            {uniqueProperties.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Floors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Floor ID</TableHead>
                <TableHead>Floor Name</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Rooms Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((floor) => (
                <TableRow key={floor.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell className="font-mono text-xs font-bold">{floor.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{floor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building className="h-3.5 w-3.5" />
                      {floor.propertyName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold border-none bg-primary/10 text-primary">
                      {floor.roomCount} Rooms
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleArchive(floor.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Archive Floor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No active floors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Floor Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add New Floor</DialogTitle>
            <DialogDescription>Create a floor layer to group rooms within your property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="propertyName">Target Property</Label>
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
              <Label htmlFor="floorName">Floor Name</Label>
              <Input
                id="floorName"
                placeholder="e.g. 4th Floor, Basement A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!form.name.trim()}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Create Floor
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
