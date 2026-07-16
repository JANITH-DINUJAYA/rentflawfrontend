"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  LifeBuoy, PlusCircle, Clock, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Loader2, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface SupportTicket {
  id: string;
  category: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  resolved_at?: string;
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

export default function TenantSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", priority: "MEDIUM" as TicketPriority });

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/support");
      setTickets(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description) return;
    setCreateLoading(true);

    try {
      await api.post("/support", form);
      setShowCreate(false);
      setForm({ category: "", description: "", priority: "MEDIUM" });
      await fetchTickets();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create support ticket.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support & Maintenance</h2>
          <p className="text-sm text-muted-foreground">Submit maintenance requests or report issues directly to your landlord.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Main List */}
      <Card className="border border-border bg-card">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-sm font-semibold">{error}</p>
              <button onClick={fetchTickets} className="text-primary hover:underline text-xs mt-2">
                Retry
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">No support tickets</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Everything looks good! If you have any issues with plumbing, electricity, or other assets, click the button above to file a request.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((t) => {
                const statusInfo = STATUS_META[t.status] || STATUS_META.OPEN;
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-accent/30 px-3 -mx-3 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground truncate">{t.category}</p>
                          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-0 ${PRIORITY_COLOR[t.priority]}`}>
                            {t.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px] mt-0.5">
                          {t.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-foreground">
                          {statusInfo.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Filed on {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── MODAL: View Ticket Details ─── */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] font-bold uppercase tracking-wider border-0 ${STATUS_META[selectedTicket.status].color}`}>
                    {selectedTicket.status}
                  </Badge>
                  <Badge className={`text-[10px] font-bold uppercase tracking-wider border-0 ${PRIORITY_COLOR[selectedTicket.priority]}`}>
                    {selectedTicket.priority} Priority
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold">{selectedTicket.category}</DialogTitle>
                <DialogDescription>
                  Ticket ID: {selectedTicket.id} | Filed on {new Date(selectedTicket.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Issue Description</p>
                  <p className="text-sm bg-accent/40 rounded-xl p-4 border border-border/60 text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.resolved_at && (
                  <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm font-semibold">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div>
                      <p>Resolved</p>
                      <p className="text-xs font-normal opacity-80">Issue closed on {new Date(selectedTicket.resolved_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Create New Support Request ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">New Support Request</DialogTitle>
            <DialogDescription>Describe the issue or repair needed. Your landlord will be notified.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category / Asset</Label>
              <Input
                id="category"
                required
                placeholder="e.g. Broken water pipe, AC not cooling"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) => setForm({ ...form, priority: (val || "MEDIUM") as TicketPriority })}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low (General Inquiry)</SelectItem>
                  <SelectItem value="MEDIUM">Medium (Minor Issue)</SelectItem>
                  <SelectItem value="HIGH">High (Urgent Repair)</SelectItem>
                  <SelectItem value="URGENT">Urgent (Safety / Leak)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
              <Textarea
                id="description"
                required
                rows={4}
                placeholder="Please describe exactly what happened and where the problem is located..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            >
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Submit Request</>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
