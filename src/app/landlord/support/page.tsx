"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HelpCircle, Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Ticket {
  id: string;
  category: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  resolved_at: string | null;
  tenant: { first_name: string; last_name: string; email: string };
}

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-600 border-green-500/20",
};

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "bg-gray-500/10 text-gray-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  URGENT: "bg-red-500/10 text-red-600",
};

export default function LandlordSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDialogTicket, setStatusDialogTicket] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>("OPEN");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/support");
      setTickets(res.data);
    } catch {
      setError("Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const openStatusDialog = (ticket: Ticket) => {
    setStatusDialogTicket(ticket);
    setNewStatus(ticket.status);
  };

  const handleStatusUpdate = async () => {
    if (!statusDialogTicket) return;
    setStatusUpdating(true);
    try {
      await api.patch(`/support/${statusDialogTicket.id}/status`, { status: newStatus });
      setStatusDialogTicket(null);
      await fetchTickets();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : msg || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const summaryStats = {
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    completed: tickets.filter(t => t.status === "COMPLETED").length,
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenant Support Tickets</h2>
          <p className="text-sm text-muted-foreground">Manage and resolve maintenance requests from your tenants.</p>
        </div>
        <button onClick={fetchTickets} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent/50 transition-colors cursor-pointer">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: summaryStats.open, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { label: "In Progress", count: summaryStats.inProgress, icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Completed", count: summaryStats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchTickets} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      No support tickets yet from your tenants.
                    </TableCell>
                  </TableRow>
                ) : tickets.map(ticket => (
                  <TableRow key={ticket.id} className="hover:bg-accent/20 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{ticket.tenant.first_name} {ticket.tenant.last_name}</p>
                        <p className="text-xs text-muted-foreground">{ticket.tenant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{ticket.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{ticket.description}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityStyles[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyles[ticket.status]}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => openStatusDialog(ticket)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        Update Status
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogTicket !== null} onOpenChange={o => !o && setStatusDialogTicket(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Update Ticket Status</DialogTitle>
            <DialogDescription>
              {statusDialogTicket && `Ticket from ${statusDialogTicket.tenant.first_name} — "${statusDialogTicket.category}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <Select value={newStatus} onValueChange={v => { if (v) setNewStatus(v as TicketStatus); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setStatusDialogTicket(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={statusUpdating} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {statusUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Status
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
