"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
  Building,
  Layers,
  DoorOpen,
  FileText,
  Users,
  Shield,
  Gauge,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface TrashItem {
  id: string;
  entity_type: string;
  name: string;
  archived_at: string | null;
  days_remaining: number;
  details?: string;
}

const entityIcons: Record<string, React.ComponentType<any>> = {
  Property: Building,
  Floor: Layers,
  Room: DoorOpen,
  "Utility Bill": Zap,
  "Staff Profile": Users,
  "Subscription Package": Gauge,
  "Deactivated User": Shield,
  "Rental Agreement": FileText,
  Landlord: Users,
  Tenant: Users,
};

export function TrashPageView() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trash");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load trash items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const handleRestore = async (item: TrashItem) => {
    setActionId(item.id);
    setMessage(null);
    try {
      await api.patch(`/trash/${encodeURIComponent(item.entity_type)}/${item.id}/restore`);
      setMessage({ text: `Successfully restored ${item.name} back to active list.`, type: "success" });
      await fetchTrashItems();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to restore item.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }
    setActionId(item.id);
    setMessage(null);
    try {
      await api.delete(`/trash/${encodeURIComponent(item.entity_type)}/${item.id}/permanent`);
      setMessage({ text: `Permanently purged ${item.name}.`, type: "success" });
      await fetchTrashItems();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to permanently delete item.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-destructive" /> Trash Bin & Soft-Delete Recovery
            </h2>
            <p className="text-sm text-muted-foreground">
              Items deleted from your workspace remain here for 30 days before permanent automatic purge.
            </p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertTriangle className="h-4.5 w-4.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Informational Alert */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <span className="font-bold">30-Day Auto-Purge Policy:</span> All soft-deleted properties, floors, rooms, utility bills, and staff profiles are retained for 30 days. Click <span className="font-bold">Restore</span> to recover any item immediately.
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <Trash2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-extrabold text-base">Trash Bin is Empty</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                No items have been soft-deleted. When you delete properties, rooms, or staff, they will appear here for 30 days.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Item Details</th>
                    <th className="p-4">Entity Type</th>
                    <th className="p-4">Archived Date</th>
                    <th className="p-4">Auto-Purge Countdown</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const IconComp = entityIcons[item.entity_type] || Trash2;
                    const isProcessing = actionId === item.id;
                    return (
                      <tr key={`${item.entity_type}-${item.id}`} className="hover:bg-accent/10 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              <IconComp className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{item.name}</p>
                              {item.details && <p className="text-[11px] text-muted-foreground">{item.details}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {item.entity_type}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {item.archived_at ? new Date(item.archived_at).toLocaleDateString() : "Recently"}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            item.days_remaining <= 5 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-600"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {item.days_remaining} {item.days_remaining === 1 ? "day left" : "days left"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestore(item)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-bold hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" /> Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
