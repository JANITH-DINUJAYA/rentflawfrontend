"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  Building, 
  MapPin, 
  Layers, 
  Trash2, 
  Plus, 
  X, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Property {
  id: string;
  name: string;
  address: string;
  type: "APARTMENT" | "CO_LIVING" | "HOSTEL" | "HOUSE";
  floorsCount: number;
  roomsCount: number;
}

export default function PropertiesPage() {
  // Mock data for initial rendering
  const [properties, setProperties] = React.useState<Property[]>([
    { id: "1", name: "Greenwood Residence", address: "124 Park Ave, New York, NY", type: "APARTMENT", floorsCount: 3, roomsCount: 12 },
    { id: "2", name: "City Center Hostels", address: "89 Broadway St, Boston, MA", type: "HOSTEL", floorsCount: 2, roomsCount: 16 },
    { id: "3", name: "Suburban Shared House", address: "55 Pine Lane, Austin, TX", type: "CO_LIVING", floorsCount: 1, roomsCount: 5 }
  ]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [type, setType] = React.useState<Property["type"]>("APARTMENT");
  const [formError, setFormError] = React.useState("");

  const [confirmArchiveId, setConfirmArchiveId] = React.useState<string | null>(null);

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !address.trim()) {
      setFormError("All fields are required");
      return;
    }

    const newProperty: Property = {
      id: String(properties.length + 1),
      name,
      address,
      type,
      floorsCount: 0,
      roomsCount: 0
    };

    setProperties([newProperty, ...properties]);
    setDialogOpen(false);
    setName("");
    setAddress("");
    setType("APARTMENT");
  };

  const handleArchiveProperty = (id: string) => {
    // Soft archive by filtering out of the mock state
    setProperties(properties.filter(p => p.id !== id));
    setConfirmArchiveId(null);
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
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Property
        </button>
      </div>

      {/* ─── Properties Grid ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[10px] uppercase font-bold tracking-wider">
                    {p.type.replace("_", " ")}
                  </Badge>
                  <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
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
                  <p className="text-lg font-extrabold">{p.floorsCount}</p>
                </div>
                <div className="border-l border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Rooms</p>
                  <p className="text-lg font-extrabold">{p.roomsCount}</p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  ID: {p.id}
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setConfirmArchiveId(p.id)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Archive Property"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200">
                    Manage Property
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Add Property Dialog ────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Create a new physical property profile. You can later add floors and rooms to this building.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProperty} className="space-y-4 py-2">
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
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APARTMENT">Apartment Building</SelectItem>
                  <SelectItem value="CO_LIVING">Co-Living Space</SelectItem>
                  <SelectItem value="HOSTEL">Hostel / Boarding House</SelectItem>
                  <SelectItem value="HOUSE">Standalone House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200"
              >
                Create Property
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
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-accent/50 transition-all duration-200"
            >
              No, Keep It
            </button>
            <button
              onClick={() => confirmArchiveId && handleArchiveProperty(confirmArchiveId)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 shadow-md shadow-destructive/10 transition-all duration-200"
            >
              Yes, Archive
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
