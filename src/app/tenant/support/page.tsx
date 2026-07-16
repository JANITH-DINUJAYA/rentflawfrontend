"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HelpCircle, Plus, Loader2, AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
}

const statusStyles: Record<TicketStatus, { label: string; class: string; icon: React.ComponentType<any> }> = {
  OPEN: { label: "Open", class: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: RefreshCw },
  COMPLETED: { label: "Resolved", class: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
};

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "bg-gray-500/10 text-gray-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-600",
  HIGH: "bg-orange-500/10 text-orange-600",
  URGENT: "bg-red-500/10 text-red-600",
};

const emptyForm = { category: "", description: "", priority: "MEDIUM" as TicketPriority };

export default function TenantSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/support");
      setTickets(res.data);
    } catch {
      setError("Failed to load your support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim() || !form.description.trim()) {
      setFormError("Category and description are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/support", form);
      setShowCreate(false);
      setForm(emptyForm);
      await fetchTickets();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg[0] : msg || "Failed to submit ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support & Maintenance</h2>
          <p className="text-sm text-muted-foreground">Submit and track your maintenance requests and complaints.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchTickets} className="text-primary hover:underline text-xs">Retry</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-bold">No support requests yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Need help with something? Submit a request and your landlord will respond.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const s = statusStyles[ticket.status];
            const Icon = s.icon;
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{ticket.category}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${priorityStyles[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(ticket.created_at).toLocaleDateString()}
                        {ticket.resolved_at && ` · Resolved ${new Date(ticket.resolved_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold flex-shrink-0 ${s.class}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {s.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Submit Support Request</DialogTitle>
            <DialogDescription>Describe your issue and your landlord will be notified.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Plumbing, Electrical" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => { if (v) setForm(f => ({ ...f, priority: v as TicketPriority })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea
                id="description"
                placeholder="Describe the issue in detail so your landlord can act quickly..."
                className="min-h-[120px] resize-none"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent/50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit Request
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
