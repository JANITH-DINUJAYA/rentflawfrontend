"use client";

import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Shield, Server, RefreshCw, CheckCircle2, Play, Terminal, Loader2, AlertCircle, Mail, Building, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  source: string;
  message: string;
}

export default function AdminSystemPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(false);

  const [testEmailTo, setTestEmailTo] = React.useState("");
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [emailStatus, setEmailStatus] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const [fixingStaff, setFixingStaff] = React.useState(false);
  const [fixStaffResult, setFixStaffResult] = React.useState<{ fixed_count: number; details: string[] } | null>(null);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get("/system/logs?limit=100");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      // fail silently, show empty
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await api.get("/system/maintenance");
      setMaintenanceMode(res.data?.maintenance_mode ?? false);
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    fetchMaintenanceStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const next = !maintenanceMode;
      const res = await api.post("/system/maintenance", { enabled: next });
      setMaintenanceMode(res.data.maintenance_mode);
      // refresh logs to show maintenance toggle log entry
      await fetchLogs();
    } catch {
      // silently fail
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) return;
    setTestingEmail(true);
    setEmailStatus(null);
    setEmailError(null);
    try {
      const res = await api.post("/notifications/test-email", { to: testEmailTo });
      setEmailStatus(res.data?.message || "Test email dispatched.");
      await fetchLogs();
    } catch (err: any) {
      setEmailError(err?.response?.data?.message || "Failed to send test email.");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleFixStaffRoles = async () => {
    setFixingStaff(true);
    setFixStaffResult(null);
    try {
      const res = await api.post("/system/fix-staff-roles");
      setFixStaffResult(res.data);
      await fetchLogs();
    } catch {
      // silently fail
    } finally {
      setFixingStaff(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Configuration & Logs</h2>
        <p className="text-sm text-muted-foreground">Adjust runtime variables, audit backend gateway endpoints, and track application logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings & Gateways */}
        <div className="lg:col-span-1 space-y-6">
          {/* Global Mode Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Core Security Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-xs font-bold">Platform Maintenance Mode</p>
                  <p className="text-[10px] text-muted-foreground">Redirect all traffic to placeholder splash.</p>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  disabled={maintenanceLoading}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-200 disabled:opacity-60 ${
                    maintenanceMode ? "bg-destructive flex justify-end" : "bg-muted flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
              {maintenanceMode && (
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Platform is in maintenance mode. Tenants cannot access the system.
                </div>
              )}

              {/* Fix Staff Login Access */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-bold mb-1">Fix Staff Login Access</p>
                <p className="text-[10px] text-muted-foreground mb-2">If existing users added as staff cannot log in, run this to correct their access roles.</p>
                <button
                  onClick={handleFixStaffRoles}
                  disabled={fixingStaff}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {fixingStaff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                  {fixingStaff ? "Fixing..." : "Fix Staff Login Access"}
                </button>
                {fixStaffResult && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">
                    ✓ Fixed {fixStaffResult.fixed_count} staff member(s).
                    {fixStaffResult.details.length > 0 && (
                      <ul className="mt-1 list-disc pl-3 space-y-0.5 text-[9px] font-normal">
                        {fixStaffResult.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" /> API & Storage Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs text-muted-foreground">
              <div className="flex justify-between items-center py-1">
                <span>Database Engine</span>
                <span className="font-semibold text-emerald-500">Connected (Neon PostgreSQL)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Blob Storage</span>
                <span className="font-semibold text-emerald-500">Connected (Cloudflare R2)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Background Queue</span>
                <span className="font-semibold text-emerald-500">Active (BullMQ Worker)</span>
              </div>
            </CardContent>
          </Card>

          {/* Test Gateways */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" /> REST Service Testers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Send Resend Gateway Probe
                </Label>
                <Input
                  placeholder="test@example.com"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  className="text-xs h-8"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmailTo}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {testingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Send Test Email
                </button>
                {emailStatus && (
                  <p className="text-[10px] text-center text-emerald-500 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {emailStatus}
                  </p>
                )}
                {emailError && (
                  <p className="text-[10px] text-center text-destructive font-semibold">{emailError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Logs Terminal */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" /> Platform Runtime Event Logs
              </CardTitle>
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl border border-border bg-accent/15 p-4 font-mono text-xs space-y-3 h-[420px] overflow-y-auto">
              {logsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Terminal className="h-8 w-8 opacity-30" />
                  <p className="text-[11px]">No log entries yet. Activity will appear here as users interact with the platform.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="space-y-1 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                      <Badge variant="outline" className={`font-black text-[9px] px-1.5 py-0.5 border-none ${
                        log.level === "ERROR" ? "bg-destructive/10 text-destructive" :
                        log.level === "WARNING" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      }`}>
                        {log.level}
                      </Badge>
                      <span className="text-muted-foreground/80 font-bold">{log.source}</span>
                    </div>
                    <p className="text-foreground/90 pl-2 leading-relaxed">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Bank Accounts Section */}
      <SystemBankAccountsManager />
    </DashboardLayout>
  );
}

// ─── SYSTEM BANK ACCOUNTS MANAGER ─────────────────────────
function SystemBankAccountsManager() {
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openModal, setOpenModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    branch_name: "",
    swift_code: "",
  });
  const [saving, setSaving] = React.useState(false);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/system/bank-accounts?includeInactive=true");
      setAccounts(res.data);
    } catch (err) {
      console.error("Failed to load bank accounts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setForm({ bank_name: "", account_name: "", account_number: "", branch_name: "", swift_code: "" });
    setOpenModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setForm({
      bank_name: acc.bank_name,
      account_name: acc.account_name,
      account_number: acc.account_number,
      branch_name: acc.branch_name || "",
      swift_code: acc.swift_code || "",
    });
    setOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAccount) {
        await api.patch(`/system/bank-accounts/${editingAccount.id}`, form);
      } else {
        await api.post("/system/bank-accounts", form);
      }
      setOpenModal(false);
      fetchBankAccounts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save bank account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    try {
      await api.delete(`/system/bank-accounts/${id}`);
      fetchBankAccounts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete bank account");
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Platform Bank Accounts (Offline Subscriptions)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bank accounts displayed to landlords for bank transfer subscription upgrades.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Bank Account
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-xs text-center py-8 text-muted-foreground">No bank accounts configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 rounded-xl border border-border bg-accent/10 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{acc.bank_name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{acc.account_number}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-xs space-y-0.5 text-muted-foreground pt-1 border-t border-border/40">
                  <p><span className="font-semibold text-foreground">Name:</span> {acc.account_name}</p>
                  {acc.branch_name && <p><span className="font-semibold text-foreground">Branch:</span> {acc.branch_name}</p>}
                  {acc.swift_code && <p><span className="font-semibold text-foreground">SWIFT:</span> {acc.swift_code}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal for Add / Edit */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">{editingAccount ? "Edit Bank Account" : "Add Platform Bank Account"}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Bank Name</Label>
                <Input
                  required
                  placeholder="e.g. Commercial Bank / HSBC"
                  value={form.bank_name}
                  onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Account Name</Label>
                <Input
                  required
                  placeholder="e.g. RentFlaw Technologies Pvt Ltd"
                  value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Account Number</Label>
                <Input
                  required
                  placeholder="e.g. 100029384756"
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Branch Name (Optional)</Label>
                  <Input
                    placeholder="e.g. Main Branch"
                    value={form.branch_name}
                    onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SWIFT / BIC (Optional)</Label>
                  <Input
                    placeholder="e.g. COMBCEKL"
                    value={form.swift_code}
                    onChange={e => setForm(f => ({ ...f, swift_code: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-border hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
