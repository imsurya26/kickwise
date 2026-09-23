"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  PieChart,
  Compass,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { SimulationResult } from "@/lib/validation";
import { TabType } from "@/components/sidebar";

import { Text3DFlip } from "@/components/ui/text-3d-flip";

interface ResultPopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResult | null;
  homeTeam: string;
  awayTeam: string;
  onNavigateTab?: (tab: TabType) => void;
}

export function ResultPopUpModal({
  isOpen,
  onClose,
  result,
  homeTeam,
  awayTeam,
  onNavigateTab,
}: ResultPopUpModalProps) {
  if (!isOpen || !result) return null;

  const homePct = Math.round(result.home_win_probability * 100);
  const drawPct = Math.round(result.draw_probability * 100);
  const awayPct = Math.round(result.away_win_probability * 100);

  // Highest probability outcome
  const outcomeText =
    homePct > awayPct && homePct > drawPct
      ? `${homeTeam} Win Expected`
      : awayPct > homePct && awayPct > drawPct
      ? `${awayTeam} Win Expected`
      : "Draw Most Likely";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-[--kw-border] bg-[--kw-surface] p-6 sm:p-8 shadow-2xl"
        >
          {/* Top Google RGB decorative bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="flex-1 bg-[#4285f4]" />
            <div className="flex-1 bg-[#ea4335]" />
            <div className="flex-1 bg-[#fbbc04]" />
            <div className="flex-1 bg-[#34a853]" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[--kw-surface-2] text-[--kw-subtext] hover:bg-[--kw-border] hover:text-[--kw-text] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-mono font-semibold text-[#4285f4] mb-3">
              <Zap className="h-3.5 w-3.5" />
              SIMULATION COMPLETE
            </div>
            <h2 className="font-heading font-swanky text-2xl sm:text-3xl text-[--kw-heading] tracking-wide">
              <Text3DFlip
                className="inline-block"
                textClassName="text-[--kw-heading]"
                flipTextClassName="text-[--kw-heading]"
                rotateDirection="top"
                staggerDuration={0.02}
              >
                Match Forecast Result
              </Text3DFlip>
            </h2>
            <p className="text-xs text-[--kw-subtext] font-sans mt-1">
              Calibrated by KICKWISE XGBoost & Bivariate Poisson ML Model
            </p>
          </div>

          {/* Match Scoreline Prediction Banner */}
          <div className="rounded-2xl border border-[--kw-border] bg-[--kw-surface-2] p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <span className="font-heading font-swanky text-base sm:text-lg text-[#4285f4] block truncate">
                  {homeTeam}
                </span>
                <span className="font-mono text-xs text-[--kw-subtext]">
                  {result.expected_home_goals.toFixed(2)} xG
                </span>
              </div>

              {/* Scoreline Center */}
              <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-[--kw-surface-3] border border-[--kw-border] shadow-sm flex-shrink-0">
                <div className="font-mono text-2xl sm:text-3xl font-black text-[--kw-heading]">
                  {Math.round(result.expected_home_goals)} — {Math.round(result.expected_away_goals)}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[--kw-muted]">
                  Projected Score
                </span>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <span className="font-heading font-swanky text-base sm:text-lg text-[#34a853] block truncate">
                  {awayTeam}
                </span>
                <span className="font-mono text-xs text-[--kw-subtext]">
                  {result.expected_away_goals.toFixed(2)} xG
                </span>
              </div>
            </div>
          </div>

          {/* Probability Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs font-semibold font-mono">
              <span className="text-[#4285f4]">{homeTeam} {homePct}%</span>
              <span className="text-[#fbbc04]">Draw {drawPct}%</span>
              <span className="text-[#34a853]">{awayTeam} {awayPct}%</span>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full border border-[--kw-border] bg-[--kw-surface-2]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${homePct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[#4285f4]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${drawPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[#fbbc04]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${awayPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[#34a853]"
              />
            </div>
          </div>

          {/* Tactical Summary Highlight */}
          {result.tactical_summary && (
            <div className="rounded-xl border border-purple-500/30 bg-[--kw-surface-2] p-3.5 mb-6 text-xs text-[--kw-text] leading-relaxed" style={{ borderLeftWidth: 4, borderLeftColor: "#9334e6" }}>
              <div className="flex items-center gap-1.5 font-semibold text-[#9334e6] mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Key Tactical Driver
              </div>
              <p className="line-clamp-2">
                {result.tactical_summary.split("\n")[0]}
              </p>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onClose();
                onNavigateTab?.("forecast");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4285f4] text-white px-4 py-2.5 text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              <PieChart className="h-4 w-4" />
              Inspect Match Forecast
              <ArrowRight className="h-3.5 w-3.5 ml-auto" />
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateTab?.("radar");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[--kw-surface-2] border border-[--kw-border] text-[--kw-text] px-4 py-2.5 text-xs font-semibold hover:bg-[--kw-surface-3] transition-colors"
            >
              <Compass className="h-4 w-4 text-[#34a853]" />
              View Tactical Radar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
