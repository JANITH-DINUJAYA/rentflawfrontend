"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Server, RefreshCw, CheckCircle2, Play, Terminal } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  source: string;
  message: string;
}

const SYSTEM_LOGS: LogEntry[] = [
  { timestamp: "2026-07-16 14:15:22", level: "INFO", source: "AuthModule", message: "User USR-772 generated a session token." },
  { timestamp: "2026-07-16 14:12:09", level: "WARNING", source: "SubscriptionsGuard", message: "Landlord LL-002 hit their Max Properties limit on STARTER tier." },
  { timestamp: "2026-07-16 13:59:58", level: "INFO", source: "CronScheduler", message: "Successfully executed daily utility billing invoice match scans." },
  { timestamp: "2026-07-16 13:30:12", level: "ERROR", source: "ResendGateway", message: "Failed to dispatch rent notification alert to user: SMTP timeout." }
];

export default function AdminSystemPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>(SYSTEM_LOGS);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [testingResend, setTestingResend] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);

  const testGateway = () => {
    setTestingResend(true);
    setResendStatus("Connecting to Resend REST API Gateway...");
    setTimeout(() => {
      setResendStatus("Success! Dispatched test confirmation email.");
      setTestingResend(false);
      const newLog: LogEntry = {
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        level: "INFO",
        source: "ResendGateway",
        message: "Manually triggered REST verification email completed."
      };
      setLogs([newLog, ...logs]);
    }, 1500);
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
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-200 ${
                    maintenanceMode ? "bg-destructive flex justify-end" : "bg-muted flex justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
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
                <button
                  onClick={testGateway}
                  disabled={testingResend}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/95 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> Send Resend Mail Gateway Probe
                </button>
                {resendStatus && (
                  <p className="text-[10px] text-center text-primary font-semibold">{resendStatus}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Logs Term */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Platform Runtime Event Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-xl border border-border bg-accent/15 p-4 font-mono text-xs space-y-3 h-[360px] overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground">{log.timestamp}</span>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
