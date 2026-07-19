"use client";

import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Shield, Server, RefreshCw, CheckCircle2, Play, Terminal, Loader2, AlertCircle, Mail } from "lucide-react";
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
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/95 disabled:opacity-40 flex items-center justify-center gap-1.5"
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
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-50"
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
    </DashboardLayout>
  );
}
