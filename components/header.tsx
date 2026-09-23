"use client";

import { Activity, Cpu, Database, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  status?: "connected" | "simulating" | "idle" | "error";
  modelVersion?: string;
  latencyMs?: number;
}

export function Header({
  status = "connected",
  modelVersion = "v1.2.0-prod",
  latencyMs = 24,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-zinc-900/90 shadow-[0_0_15px_-3px_rgba(0,240,255,0.3)]">
            <Zap className="h-5 w-5 text-cyan-400" />
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-widest text-zinc-100">
                KICKWISE
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                BUNDESLIGA ML
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 hidden sm:block">
              TACTICAL WHAT-IF SIMULATOR & PREDICTIVE ANALYTICS
            </p>
          </div>
        </div>

        {/* Telemetry Status Bar */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          {/* Database / Supabase */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-400">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[11px]">SUPABASE SYNCED</span>
          </div>

          {/* Model Artifact Info */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px]">{modelVersion}</span>
          </div>

          {/* System Latency / Status Badge */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide",
              status === "connected" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
              status === "simulating" &&
                "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 animate-pulse",
              status === "error" &&
                "border-red-500/30 bg-red-500/10 text-red-400",
              status === "idle" &&
                "border-zinc-700 bg-zinc-800/50 text-zinc-300"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                status === "connected" && "bg-emerald-400 shadow-[0_0_8px_#10b981]",
                status === "simulating" && "bg-cyan-400 shadow-[0_0_8px_#00f0ff]",
                status === "error" && "bg-red-400 shadow-[0_0_8px_#ef4444]",
                status === "idle" && "bg-zinc-500"
              )}
            />
            <span>
              {status === "simulating" ? "SIMULATING..." : `${latencyMs}ms ONLINE`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
