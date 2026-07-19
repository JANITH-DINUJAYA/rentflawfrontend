"use client";

import React, { useState } from "react";
import { Wrench, RefreshCw, ServerOff } from "lucide-react";
import { api } from "@/lib/api";

export default function MaintenancePage() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleRetry = async () => {
    setChecking(true);
    setStatus(null);
    try {
      // Test endpoint
      await api.get("/auth/me");
      // If it doesn't throw 503, it means maintenance mode is off!
      setStatus("system_online");
      // Redirect to home/dashboard
      window.location.href = "/login";
    } catch (err: any) {
      if (err.response?.status === 503) {
        setStatus("still_maintenance");
      } else {
        // If it's a 401 or something else, the system is online but we are unauthenticated.
        setStatus("system_online");
        window.location.href = "/login";
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white selection:bg-primary/30">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* Animated Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative h-24 w-24 rounded-2xl bg-slate-900 border border-primary/20 flex items-center justify-center shadow-2xl">
            <Wrench className="h-12 w-12 text-primary animate-bounce duration-1000" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            System Maintenance
          </h1>
          <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            RentFlaw is currently undergoing scheduled maintenance to upgrade security and database controls. We'll be back online shortly.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {checking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check System Status
          </button>
        </div>

        {/* Status Info */}
        {status === "still_maintenance" && (
          <p className="text-xs text-amber-500 font-semibold flex items-center justify-center gap-1.5 animate-fade-in">
            <ServerOff className="h-3.5 w-3.5" /> Maintenance is still active. Please check back later.
          </p>
        )}
      </div>
    </div>
  );
}
