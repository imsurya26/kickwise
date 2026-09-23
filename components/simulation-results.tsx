"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  Trophy,
  Activity,
  Target,
  Clock,
  Sparkles,
  TrendingUp,
  Percent,
} from "lucide-react";
import { SimulationResult } from "@/lib/validation";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { formatProbability, formatXG } from "@/lib/utils";

interface SimulationResultsProps {
  result: SimulationResult;
  homeTeam: string;
  awayTeam: string;
}

export function SimulationResults({
  result,
  homeTeam,
  awayTeam,
}: SimulationResultsProps) {
  useEffect(() => {
    // Trigger celebratory confetti if home or away win probability is dominant
    if (result.home_win_probability > 0.6 || result.away_win_probability > 0.6) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00f0ff", "#00ff88", "#38bdf8", "#818cf8"],
      });
    }
  }, [result]);

  const dominantTeam =
    result.home_win_probability > result.away_win_probability
      ? homeTeam
      : result.away_win_probability > result.home_win_probability
      ? awayTeam
      : "Draw";

  const maxProb = Math.max(
    result.home_win_probability,
    result.draw_probability,
    result.away_win_probability
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner: Match Outcome Verdict */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-zinc-950 p-6 shadow-[0_0_40px_-10px_rgba(0,240,255,0.2)]"
      >
        <div className="absolute top-0 right-0 h-full w-1/3 bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                XGBOOST ML PREDICTION
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                GENERATED IN {result.duration_ms}MS
              </span>
            </div>
            <h2 className="font-mono text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
              {dominantTeam === "Draw" ? (
                "PROJECTED EQUILIBRIUM (DRAW)"
              ) : (
                <span className="text-cyan-300">
                  {dominantTeam.toUpperCase()} FAVORED TO WIN
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Multiclass probability distribution calibrated on 5 Bundesliga seasons with Poisson xG scoreline modeling.
            </p>
          </div>

          {/* Primary Predicted Scoreline Pill */}
          <div className="flex items-center gap-4 bg-zinc-950/90 border border-zinc-800 rounded-xl px-5 py-3 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                PROJECTED SCORE
              </span>
              <span className="font-mono text-2xl font-black text-cyan-400">
                {result.predicted_score}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                CONFIDENCE
              </span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {Math.round(maxProb * 100)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Probability Gauge Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Home Win Probability Card */}
        <div className="relative flex flex-col items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-xl hover:border-cyan-500/40 transition-colors">
          <div className="w-full flex items-center justify-between font-mono text-xs mb-2">
            <span className="text-cyan-400 font-semibold uppercase truncate">
              {homeTeam}
            </span>
            <span className="text-zinc-500">HOME</span>
          </div>

          <AnimatedCircularProgressBar
            value={Math.round(result.home_win_probability * 100)}
            gaugePrimaryColor="#00f0ff"
            label="HOME WIN"
            size={130}
          />

          <div className="mt-4 w-full flex items-center justify-between pt-3 border-t border-zinc-800/60 font-mono text-xs text-zinc-400">
            <span>EXPECTED GOALS</span>
            <span className="font-bold text-cyan-300">
              {formatXG(result.expected_home_goals)} xG
            </span>
          </div>
        </div>

        {/* Draw Probability Card */}
        <div className="relative flex flex-col items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-xl hover:border-zinc-700 transition-colors">
          <div className="w-full flex items-center justify-between font-mono text-xs mb-2">
            <span className="text-zinc-300 font-semibold uppercase">DRAW</span>
            <span className="text-zinc-500">STALEMATE</span>
          </div>

          <AnimatedCircularProgressBar
            value={Math.round(result.draw_probability * 100)}
            gaugePrimaryColor="#94a3b8"
            label="DRAW"
            size={130}
          />

          <div className="mt-4 w-full flex items-center justify-between pt-3 border-t border-zinc-800/60 font-mono text-xs text-zinc-400">
            <span>POISSON OVERLAP</span>
            <span className="font-bold text-zinc-300">
              {formatProbability(result.draw_probability)}
            </span>
          </div>
        </div>

        {/* Away Win Probability Card */}
        <div className="relative flex flex-col items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-xl hover:border-emerald-500/40 transition-colors">
          <div className="w-full flex items-center justify-between font-mono text-xs mb-2">
            <span className="text-emerald-400 font-semibold uppercase truncate">
              {awayTeam}
            </span>
            <span className="text-zinc-500">AWAY</span>
          </div>

          <AnimatedCircularProgressBar
            value={Math.round(result.away_win_probability * 100)}
            gaugePrimaryColor="#10b981"
            label="AWAY WIN"
            size={130}
          />

          <div className="mt-4 w-full flex items-center justify-between pt-3 border-t border-zinc-800/60 font-mono text-xs text-zinc-400">
            <span>EXPECTED GOALS</span>
            <span className="font-bold text-emerald-300">
              {formatXG(result.expected_away_goals)} xG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
