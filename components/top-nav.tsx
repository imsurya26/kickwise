"use client";

import { motion } from "framer-motion";
import { Play, Zap } from "lucide-react";
import { TabType } from "./sidebar";
import { cn } from "@/lib/utils";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

interface TopNavProps {
  activeTab: TabType;
  homeTeam: string;
  awayTeam: string;
  onSimulate: () => void;
  isSimulating: boolean;
  latencyMs?: number;
}

const TAB_INFO: Record<TabType, { title: string; subtitle: string; color: string }> = {
  landing: {
    title: "KICKWISE AI Telemetry & Outcomes",
    subtitle: "End-to-end Bundesliga machine learning and tactical simulation platform.",
    color: "text-blue-600",
  },
  simulator: {
    title: "Tactical Pitch Simulator",
    subtitle: "Customize your starting XI and formation, then simulate.",
    color: "text-blue-600",
  },
  forecast: {
    title: "Match Outcome Forecast",
    subtitle: "XGBoost win probabilities and Poisson expected goals.",
    color: "text-red-600",
  },
  radar: {
    title: "6-Axis Tactical Radar",
    subtitle: "Attack, creation, control, pressing, defence, and transition.",
    color: "text-yellow-600",
  },
  matrix: {
    title: "Scoreline Probability Matrix",
    subtitle: "Bivariate Poisson joint probability density, 0–5 goals.",
    color: "text-green-600",
  },
  explain: {
    title: "SHAP Explainability Engine",
    subtitle: "Feature attribution weights with plain-English tactical reasoning.",
    color: "text-purple-600",
  },
  model: {
    title: "Model Performance Dashboard",
    subtitle: "XGBoost accuracy, Poisson calibration, and feature importance.",
    color: "text-blue-600",
  },
  derbies: {
    title: "Bundesliga Derby Quick-Launch",
    subtitle: "One-click simulations for Germany's fiercest rivalries.",
    color: "text-red-600",
  },
};

export function TopNav({
  activeTab,
  homeTeam,
  awayTeam,
  onSimulate,
  isSimulating,
  latencyMs = 24,
}: TopNavProps) {
  const info = TAB_INFO[activeTab] || TAB_INFO.simulator;

  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[--kw-border] bg-white p-4 sm:p-5 shadow-[var(--kw-shadow-sm)] mb-5">
      {/* Left: Breadcrumb + Title */}
      <div className="min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[--kw-muted] mb-1.5 flex-wrap">
          <span className="text-google-rgb font-bold">KICKWISE</span>
          <span className="text-[--kw-border]">/</span>
          <span className={cn("font-semibold", info.color)}>
            {TAB_INFO[activeTab]?.title.split(" ")[0]}
          </span>
          <span className="text-[--kw-border]">/</span>
          <span className="text-[--kw-subtext] truncate">{homeTeam} vs {awayTeam}</span>
        </div>

        <DiaTextReveal
          text={info.title}
          className="text-lg sm:text-xl font-extrabold tracking-tight"
          gradientClassName="from-[#4285f4] via-[#1a73e8] to-[#0d47a1]"
          delay={0.05}
        />
        <p className="text-xs text-[--kw-subtext] font-sans mt-1 max-w-lg leading-relaxed">
          {info.subtitle}
        </p>
      </div>

      {/* Right: Status + Simulate */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0">
        {/* Latency pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[--kw-border] bg-[--kw-surface-2] px-3.5 py-1.5 font-mono text-[10px] text-[--kw-subtext]">
          <span className="h-2 w-2 rounded-full bg-[#34a853] animate-pulse" />
          <span>{latencyMs}ms</span>
        </div>

        {/* Simulate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSimulate}
          disabled={isSimulating}
          className={cn(
            "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-2.5 font-semibold text-sm transition-all duration-300 min-w-[160px] focus:outline-none",
            isSimulating
              ? "bg-[--kw-surface-2] text-[--kw-muted] cursor-not-allowed"
              : "text-white shadow-lg shadow-blue-500/30"
          )}
        >
          {/* RGB gradient background */}
          {!isSimulating && (
            <span className="absolute inset-0 animate-rgb-shimmer" aria-hidden />
          )}

          <span className="relative flex items-center gap-2">
            {isSimulating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[--kw-muted]">Simulating…</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Simulate Match
              </>
            )}
          </span>
        </motion.button>
      </div>
    </header>
  );
}
