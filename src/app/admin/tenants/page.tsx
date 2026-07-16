"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Building, UserCheck } from "lucide-react";

interface GlobalTenant {
  id: string;
  name: string;
  email: string;
  landlordName: string;
  propertyName: string;
  roomNumber: string;
  status: "ACTIVE" | "INVITED" | "ENDED";
}

const SAMPLE_GLOBAL_TENANTS: GlobalTenant[] = [
  { id: "TNT-001", name: "Alice Vance", email: "alice@gmail.com", landlordName: "Greenwood Rentals", propertyName: "Greenwood Residence", roomNumber: "102", status: "ACTIVE" },
  { id: "TNT-002", name: "Marcus Brody", email: "marcus.brody@univ.edu", landlordName: "Apex Properties Ltd", propertyName: "City Center Hostels", roomNumber: "205", status: "ACTIVE" },
  { id: "TNT-003", name: "David Miller", email: "david.miller@gmail.com", landlordName: "Greenwood Rentals", propertyName: "Greenwood Residence", roomNumber: "108", status: "INVITED" },
  { id: "TNT-004", name: "John Smith", email: "john.smith@gmail.com", landlordName: "Greenwood Rentals", propertyName: "Greenwood Residence", roomNumber: "101", status: "ENDED" }
];

export default function AdminTenantsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = SAMPLE_GLOBAL_TENANTS.filter(t => {
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.landlordName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Global Tenants Directory</h2>
        <p className="text-sm text-muted-foreground">View all tenants registered on the platform across all landlord organizations.</p>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by tenant name, email, or landlord..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Email Contact</TableHead>
                <TableHead>Assigned Landlord</TableHead>
                <TableHead>Location Room</TableHead>
                <TableHead>Platform Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-accent/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {t.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.landlordName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium text-foreground">{t.propertyName}</p>
                      <p className="text-[10px] text-muted-foreground">Rm {t.roomNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">
                        <UserCheck className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    ) : t.status === "INVITED" ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold">
                        Invited
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground border-none font-bold">
                        Ended
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No tenants match search query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
