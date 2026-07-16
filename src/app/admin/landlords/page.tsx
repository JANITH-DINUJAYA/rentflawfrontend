"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Building2, Search, Loader2, AlertCircle, User, Phone, Mail, Calendar } from "lucide-react";
import { api } from "@/lib/api";

interface Landlord {
  id: string;
  company_name: string | null;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    created_at: string;
  };
}

export default function AdminLandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLandlords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/landlords");
      setLandlords(res.data);
    } catch (err: any) {
      setError("Failed to load landlords. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLandlords(); }, []);

  const filtered = landlords.filter(l =>
    `${l.user.first_name} ${l.user.last_name} ${l.user.email} ${l.company_name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Landlord Accounts</h2>
          <p className="text-sm text-muted-foreground">All registered landlords on the RentFlaw platform.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background w-full sm:w-72">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            className="text-sm bg-transparent outline-none flex-1 placeholder:text-muted-foreground"
            placeholder="Search by name or email..."
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
          <button onClick={fetchLandlords} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {search ? `No landlords matching "${search}"` : "No landlords registered yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(l => (
                    <TableRow key={l.id} className="hover:bg-accent/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {l.user.first_name?.[0]}{l.user.last_name?.[0]}
                          </div>
                          <span className="font-semibold text-sm">{l.user.first_name} {l.user.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.company_name || "—"}</TableCell>
                      <TableCell className="text-sm">{l.user.email}</TableCell>
                      <TableCell className="text-sm">{l.user.phone}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(l.user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-[10px]">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
