"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  LifeBuoy, Search, PlusCircle, AlertTriangle, Clock, CheckCircle2, XCircle, MessageSquare, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface SupportTicket {
  id: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  category: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_META: Record<TicketStatus, { label: string; icon: React.ElementType; color: string }> = {
  OPEN: { label: "Open", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  IN_PROGRESS: { label: "In Progress", icon: AlertTriangle, color: "text-sky-500 bg-sky-500/10" },
  RESOLVED: { label: "Resolved", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10" },
  CLOSED: { label: "Closed", icon: XCircle, color: "text-muted-foreground bg-muted/30" }
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  LOW: "text-muted-foreground bg-muted/30",
  MEDIUM: "text-sky-500 bg-sky-500/10",
  HIGH: "text-orange-500 bg-orange-500/10",
  URGENT: "text-destructive bg-destructive/10"
};

const SAMPLE_TICKETS: SupportTicket[] = [
  { id: "TKT-001", tenantName: "Alice Vance", propertyName: "Greenwood Residence", roomNumber: "102", category: "Plumbing", description: "The bathroom tap has been dripping non-stop for 3 days now. Water is pooling on the floor.", priority: "HIGH", status: "OPEN", createdAt: "2026-07-14" },
  { id: "TKT-002", tenantName: "Marcus Brody", propertyName: "City Center Hostels", roomNumber: "205", category: "Electricity", description: "Power socket near the bed stopped working. Cannot charge my laptop for work.", priority: "URGENT", status: "IN_PROGRESS", createdAt: "2026-07-12" },
  { id: "TKT-003", tenantName: "Clara Oswald", propertyName: "Greenwood Residence", roomNumber: "108", category: "Noise Complaint", description: "Neighbours on the upper floor are extremely loud every night after midnight.", priority: "MEDIUM", status: "RESOLVED", createdAt: "2026-07-05", resolvedAt: "2026-07-10" },
  { id: "TKT-004", tenantName: "John Smith", propertyName: "Greenwood Residence", roomNumber: "101", category: "General Inquiry", description: "Asking about the process for renewing the lease next month.", priority: "LOW", status: "CLOSED", createdAt: "2026-07-01" }
];

export default function SupportPage() {
  const [tickets, setTickets] = React.useState<SupportTicket[]>(SAMPLE_TICKETS);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({ category: "", description: "", priority: "MEDIUM" as TicketPriority });

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch = t.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const updateStatus = (id: string, status: TicketStatus) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status, resolvedAt: status === "RESOLVED" ? new Date().toISOString().slice(0, 10) : t.resolvedAt } : t));
    setSelectedTicket(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const handleCreate = () => {
    const newTicket: SupportTicket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
      tenantName: "Self (Landlord)",
      propertyName: "—", roomNumber: "—",
      category: form.category, description: form.description,
      priority: form.priority, status: "OPEN",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setTickets([newTicket, ...tickets]);
    setShowCreate(false);
    setForm({ category: "", description: "", priority: "MEDIUM" });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-sm text-muted-foreground">View and manage maintenance and support requests from your tenants.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(s => {
          const count = s === "ALL" ? tickets.length : tickets.filter(t => t.status === s).length;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-muted-foreground hover:bg-accent/40"}`}
            >
              {s === "ALL" ? "All" : STATUS_META[s as TicketStatus].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by tenant, category, ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => {
          const statusMeta = STATUS_META[t.status];
          const SIcon = statusMeta.icon;
          return (
            <Card
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="relative overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                    <p className="font-bold text-sm leading-snug">{t.category}</p>
                  </div>
                  <Badge variant="outline" className={`${PRIORITY_COLOR[t.priority]} border-none font-bold text-[10px]`}>
                    {t.priority}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {t.tenantName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.tenantName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.propertyName} · Rm {t.roomNumber}</p>
                  </div>
                  <Badge variant="outline" className={`${statusMeta.color} border-none font-bold text-[10px] flex items-center gap-1`}>
                    <SIcon className="h-3 w-3" /> {statusMeta.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2 mt-1">
                  <span>Created {t.createdAt}</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <LifeBuoy className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No tickets found.</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={selectedTicket !== null} onOpenChange={open => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Ticket {selectedTicket?.id}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.category} — reported by {selectedTicket?.tenantName}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <Badge variant="outline" className={`${PRIORITY_COLOR[selectedTicket.priority]} border-none font-bold`}>
                  {selectedTicket.priority} Priority
                </Badge>
                <Badge variant="outline" className={`${STATUS_META[selectedTicket.status].color} border-none font-bold flex items-center gap-1`}>
                  {React.createElement(STATUS_META[selectedTicket.status].icon, { className: "h-3 w-3" })}
                  {STATUS_META[selectedTicket.status].label}
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-accent/20 border border-border text-sm text-muted-foreground leading-relaxed">
                {selectedTicket.description}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Property</p>
                  <p className="font-semibold">{selectedTicket.propertyName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Room</p>
                  <p className="font-semibold">Rm {selectedTicket.roomNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Created</p>
                  <p className="font-semibold">{selectedTicket.createdAt}</p>
                </div>
                {selectedTicket.resolvedAt && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Resolved</p>
                    <p className="font-semibold">{selectedTicket.resolvedAt}</p>
                  </div>
                )}
              </div>

              {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  {selectedTicket.status === "OPEN" && (
                    <button onClick={() => updateStatus(selectedTicket.id, "IN_PROGRESS")}
                      className="flex-1 py-2 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-all">
                      Mark In Progress
                    </button>
                  )}
                  <button onClick={() => updateStatus(selectedTicket.id, "RESOLVED")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
                    Mark Resolved
                  </button>
                  <button onClick={() => updateStatus(selectedTicket.id, "CLOSED")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-card border border-border text-foreground hover:bg-accent/40 transition-all">
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Submit a new issue or maintenance request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Plumbing" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select value={form.priority} onValueChange={v => v !== null && setForm({ ...form, priority: v as TicketPriority })}>
                  <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button onClick={handleCreate} disabled={!form.category || !form.description}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Submit Ticket
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
