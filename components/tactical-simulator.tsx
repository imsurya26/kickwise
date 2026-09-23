"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  Target,
  Activity,
  ArrowRightLeft,
  X,
  Plus,
  Flame,
  Info,
  Zap,
} from "lucide-react";
import { Player } from "@/lib/validation";
import { cn, formatXG } from "@/lib/utils";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import Text3DFlip from "@/components/ui/text-3d-flip";

export interface FormationPreset {
  name: string;
  positions: {
    slotId: number;
    position: "GK" | "DEF" | "MID" | "FWD";
    role: string;
    x: number;
    y: number;
  }[];
}

export const FORMATION_PRESETS: Record<string, FormationPreset> = {
  "4-3-3": {
    name: "4-3-3 Attacking",
    positions: [
      { slotId: 0, position: "GK", role: "Goalkeeper", x: 50, y: 88 },
      { slotId: 1, position: "DEF", role: "Left Back", x: 16, y: 72 },
      { slotId: 2, position: "DEF", role: "Center Back L", x: 38, y: 74 },
      { slotId: 3, position: "DEF", role: "Center Back R", x: 62, y: 74 },
      { slotId: 4, position: "DEF", role: "Right Back", x: 84, y: 72 },
      { slotId: 5, position: "MID", role: "Defensive Mid", x: 50, y: 55 },
      { slotId: 6, position: "MID", role: "Central Mid L", x: 30, y: 44 },
      { slotId: 7, position: "MID", role: "Central Mid R", x: 70, y: 44 },
      { slotId: 8, position: "FWD", role: "Left Wing", x: 20, y: 22 },
      { slotId: 9, position: "FWD", role: "Striker", x: 50, y: 16 },
      { slotId: 10, position: "FWD", role: "Right Wing", x: 80, y: 22 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1 Modern",
    positions: [
      { slotId: 0, position: "GK", role: "Goalkeeper", x: 50, y: 88 },
      { slotId: 1, position: "DEF", role: "Left Back", x: 16, y: 72 },
      { slotId: 2, position: "DEF", role: "Center Back L", x: 38, y: 74 },
      { slotId: 3, position: "DEF", role: "Center Back R", x: 62, y: 74 },
      { slotId: 4, position: "DEF", role: "Right Back", x: 84, y: 72 },
      { slotId: 5, position: "MID", role: "Pivot L", x: 36, y: 56 },
      { slotId: 6, position: "MID", role: "Pivot R", x: 64, y: 56 },
      { slotId: 7, position: "MID", role: "Attacking Mid", x: 50, y: 38 },
      { slotId: 8, position: "FWD", role: "Left Attacker", x: 20, y: 28 },
      { slotId: 9, position: "FWD", role: "Striker", x: 50, y: 16 },
      { slotId: 10, position: "FWD", role: "Right Attacker", x: 80, y: 28 },
    ],
  },
  "3-4-2-1": {
    name: "3-4-2-1 Direct",
    positions: [
      { slotId: 0, position: "GK", role: "Goalkeeper", x: 50, y: 88 },
      { slotId: 1, position: "DEF", role: "Center Back L", x: 25, y: 74 },
      { slotId: 2, position: "DEF", role: "Sweeper", x: 50, y: 76 },
      { slotId: 3, position: "DEF", role: "Center Back R", x: 75, y: 74 },
      { slotId: 4, position: "MID", role: "Left Wingback", x: 12, y: 50 },
      { slotId: 5, position: "MID", role: "Central Mid L", x: 38, y: 52 },
      { slotId: 6, position: "MID", role: "Central Mid R", x: 62, y: 52 },
      { slotId: 7, position: "MID", role: "Right Wingback", x: 88, y: 50 },
      { slotId: 8, position: "FWD", role: "Inside Forward L", x: 32, y: 30 },
      { slotId: 9, position: "FWD", role: "Striker", x: 50, y: 16 },
      { slotId: 10, position: "FWD", role: "Inside Forward R", x: 68, y: 30 },
    ],
  },
};

export const BUNDESLIGA_TEAMS = [
  "Bayern Munich",
  "Borussia Dortmund",
  "Bayer Leverkusen",
  "RB Leipzig",
  "VfB Stuttgart",
  "Eintracht Frankfurt",
  "SC Freiburg",
  "TSG Hoffenheim",
  "VfL Wolfsburg",
  "Borussia Mönchengladbach",
  "Werder Bremen",
  "FC Augsburg",
  "1. FC Heidenheim",
  "1. FSV Mainz 05",
  "1. FC Union Berlin",
  "VfL Bochum",
  "FC St. Pauli",
  "Holstein Kiel",
];

interface TacticalSimulatorProps {
  homeTeam: string;
  awayTeam: string;
  onHomeTeamChange: (team: string) => void;
  onAwayTeamChange: (team: string) => void;
  homeLineup: Player[];
  awayLineup: Player[];
  availableHomePlayers: Player[];
  availableAwayPlayers: Player[];
  onHomeLineupChange: (lineup: Player[]) => void;
  onAwayLineupChange: (lineup: Player[]) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

// Player position badge colors (Google palette)
const POSITION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GK:  { bg: "#fef9e3", text: "#d97706", border: "#fde68a" },
  DEF: { bg: "#e8f5e9", text: "#34a853", border: "#c8e6c9" },
  MID: { bg: "#e8f0fe", text: "#4285f4", border: "#c5d8f7" },
  FWD: { bg: "#fce8e6", text: "#ea4335", border: "#f7c6c3" },
};

import { MagicCard } from "@/components/ui/magic-card";

export function TacticalSimulator({
  homeTeam,
  awayTeam,
  onHomeTeamChange,
  onAwayTeamChange,
  homeLineup,
  awayLineup,
  availableHomePlayers,
  availableAwayPlayers,
  onHomeLineupChange,
  onAwayLineupChange,
  onSimulate,
  isSimulating,
}: TacticalSimulatorProps) {
  const [activeSide, setActiveSide] = useState<"home" | "away">("home");
  const [formation, setFormation] = useState<string>("4-3-3");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeLineup = activeSide === "home" ? homeLineup : awayLineup;
  const availableRoster = activeSide === "home" ? availableHomePlayers : availableAwayPlayers;
  const currentPreset = FORMATION_PRESETS[formation] || FORMATION_PRESETS["4-3-3"];

  const filteredRoster = useMemo(() => {
    return availableRoster.filter((player) =>
      player.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableRoster, searchQuery]);

  const aggregateMetrics = useMemo(() => {
    const totalXG = activeLineup.reduce((s, p) => s + (p.xg_90 || 0), 0);
    const totalXA = activeLineup.reduce((s, p) => s + (p.xa_90 || 0), 0);
    const totalTackles = activeLineup.reduce((s, p) => s + (p.tackles_90 || 0), 0);
    const totalPressures = activeLineup.reduce((s, p) => s + (p.pressures_90 || 0), 0);
    return { totalXG, totalXA, totalTackles, totalPressures };
  }, [activeLineup]);

  const handlePlayerSwap = (newPlayer: Player) => {
    if (selectedSlotIndex === null) return;
    const updated = [...activeLineup];
    updated[selectedSlotIndex] = newPlayer;
    if (activeSide === "home") onHomeLineupChange(updated);
    else onAwayLineupChange(updated);
    setSelectedSlotIndex(null);
  };

  const handleSwapSides = () => {
    const tmp = homeTeam;
    onHomeTeamChange(awayTeam);
    onAwayTeamChange(tmp);
  };

  const isHome = activeSide === "home";
  const pitchBgHome = "#1a7a3a";
  const pitchBgAway = "#1a5e99";

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Team Selectors wrapped in MagicCard */}
      <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#34a853" className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Home Team */}
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-heading font-swanky text-sm text-[#4285f4] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
                Home Squad
              </span>
              <span className="text-[9px] font-mono text-[--kw-muted]">
                {homeLineup.length} players
              </span>
            </div>
            <select
              value={homeTeam}
              onChange={(e) => onHomeTeamChange(e.target.value)}
              className="w-full rounded-xl border border-[--kw-border] bg-[--kw-surface] px-4 py-2.5 text-sm text-[--kw-text] focus:border-[#4285f4] focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
            >
              {BUNDESLIGA_TEAMS.map((t) => (
                <option key={t} value={t} disabled={t === awayTeam} className="bg-[--kw-surface] text-[--kw-text]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-1.5">
            <button
              onClick={handleSwapSides}
              aria-label="Swap teams"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[--kw-border] bg-[--kw-surface] text-[--kw-subtext] hover:border-[#4285f4] hover:text-[#4285f4] hover:bg-[--kw-accent-light] transition-all shadow-sm"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[9px] tracking-widest text-[--kw-muted] uppercase">
              vs
            </span>
          </div>

          {/* Away Team */}
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-heading font-swanky text-sm text-[#34a853] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34a853]" />
                Away Squad
              </span>
              <span className="text-[9px] font-mono text-[--kw-muted]">
                {awayLineup.length} players
              </span>
            </div>
            <select
              value={awayTeam}
              onChange={(e) => onAwayTeamChange(e.target.value)}
              className="w-full rounded-xl border border-[--kw-border] bg-[--kw-surface] px-4 py-2.5 text-sm text-[--kw-text] focus:border-[#34a853] focus:outline-none focus:ring-2 focus:ring-green-200 transition-all shadow-sm"
            >
              {BUNDESLIGA_TEAMS.map((t) => (
                <option key={t} value={t} disabled={t === homeTeam} className="bg-[--kw-surface] text-[--kw-text]">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </MagicCard>

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Tactical Pitch */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Side & Formation Controls */}
          <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#34a853" className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Side toggle */}
              <div className="flex items-center gap-1 bg-[--kw-surface-2] p-1 rounded-xl border border-[--kw-border]">
                <button
                  onClick={() => setActiveSide("home")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                    isHome
                      ? "bg-[--kw-surface] text-[#4285f4] shadow-sm border border-[--kw-border]"
                      : "text-[--kw-subtext] hover:text-[--kw-text]"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
                  {homeTeam}
                </button>
                <button
                  onClick={() => setActiveSide("away")}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                    !isHome
                      ? "bg-[--kw-surface] text-[#34a853] shadow-sm border border-[--kw-border]"
                      : "text-[--kw-subtext] hover:text-[--kw-text]"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-[#34a853]" />
                  {awayTeam}
                </button>
              </div>

              {/* Formation selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[--kw-muted] uppercase">
                  Formation
                </span>
                <div className="flex gap-1">
                  {Object.keys(FORMATION_PRESETS).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormation(f)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all border",
                        formation === f
                          ? "bg-[#4285f4] text-white border-[#4285f4] shadow-sm"
                          : "border-[--kw-border] bg-[--kw-surface] text-[--kw-subtext] hover:border-[#4285f4] hover:text-[--kw-text]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </MagicCard>

          {/* Football Pitch Canvas */}
          <div
            className="relative aspect-[4/5] sm:aspect-[16/11] w-full overflow-hidden rounded-2xl shadow-lg border border-[--kw-border]"
            style={{
              background: isHome
                ? "linear-gradient(180deg, #1a7a3a 0%, #165e2e 50%, #1a7a3a 100%)"
                : "linear-gradient(180deg, #1a5e99 0%, #124980 50%, #1a5e99 100%)",
            }}
          >
            {/* Grass stripe pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 28px,
                  rgba(255,255,255,0.06) 28px,
                  rgba(255,255,255,0.06) 56px
                )`,
              }}
            />

            {/* Pitch SVG markings */}
            <svg
              className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] fill-none pointer-events-none"
              strokeWidth="1.5"
              stroke="rgba(255,255,255,0.45)"
            >
              <rect x="0" y="0" width="100%" height="100%" rx="6" />
              <line x1="0" y1="50%" x2="100%" y2="50%" />
              <circle cx="50%" cy="50%" r="14%" />
              <circle cx="50%" cy="50%" r="2" fill="rgba(255,255,255,0.5)" />
              {/* Top penalty box */}
              <rect x="22%" y="0" width="56%" height="18%" />
              <rect x="36%" y="0" width="28%" height="6%" />
              <path d="M 40% 18% A 12% 12% 0 0 0 60% 18%" />
              {/* Bottom penalty box */}
              <rect x="22%" y="82%" width="56%" height="18%" />
              <rect x="36%" y="94%" width="28%" height="6%" />
              <path d="M 40% 82% A 12% 12% 0 0 1 60% 82%" />
            </svg>

            {/* Player Pins */}
            <div className="absolute inset-4">
              {currentPreset.positions.map((slot, index) => {
                const player = activeLineup[index];
                const isSelected = selectedSlotIndex === index;
                const pos = player?.position || slot.position;
                const style = POSITION_STYLES[pos] || POSITION_STYLES.MID;
                // Display last name (or full name if single word)
                const displayName = player
                  ? (player.player_name.split(" ").length > 1
                    ? player.player_name.split(" ").slice(-1)[0]
                    : player.player_name)
                  : slot.role.split(" ")[0];

                return (
                  <motion.div
                    key={slot.slotId}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => setSelectedSlotIndex(index)}
                      className={cn(
                        "group flex flex-col items-center transition-all",
                        isSelected && "scale-110"
                      )}
                    >
                      {/* Player Pin */}
                      <div
                        className={cn(
                          "relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 font-mono text-[9px] font-bold shadow-lg transition-all",
                          isSelected && "ring-2 ring-white ring-offset-1"
                        )}
                        style={{
                          background: style.bg,
                          color: style.text,
                          borderColor: style.border,
                        }}
                      >
                        {pos}
                        {/* Swap badge */}
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 group-hover:bg-[#4285f4] group-hover:text-white transition-colors shadow-sm">
                          <ArrowRightLeft className="h-2 w-2" />
                        </div>
                      </div>

                      {/* Player Name Tag */}
                      <div className="mt-1 flex flex-col items-center rounded-lg bg-white/95 dark:bg-[#12141d]/95 px-1.5 py-0.5 border border-white/50 dark:border-white/10 shadow-sm max-w-[80px]">
                        <span className="font-sans text-[9px] font-bold text-gray-900 dark:text-gray-100 truncate w-full text-center leading-tight">
                          {displayName}
                        </span>
                        {player && (
                          <span
                            className="font-mono text-[8px] font-semibold"
                            style={{ color: style.text }}
                          >
                            {formatXG(player.xg_90)} xG
                          </span>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Metrics + Simulate */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Metrics card wrapped in MagicCard */}
          <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#9334e6" className="p-5 flex flex-col gap-4">

            <div className="flex items-center justify-between pb-3 border-b border-[--kw-border]">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#4285f4]" />
                <Text3DFlip
                  rotateDirection="top"
                  staggerDuration={0.03}
                  className="font-heading font-swanky text-base text-[--kw-text] tracking-wide"
                >
                  Tactical Metrics
                </Text3DFlip>
              </div>
              <span className="kw-chip kw-chip-blue">ACTIVE XI</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "TOTAL xG", value: aggregateMetrics.totalXG.toFixed(2), icon: Target, color: "#4285f4" },
                { label: "CREATION xA", value: aggregateMetrics.totalXA.toFixed(2), icon: Flame, color: "#34a853" },
                { label: "TACKLES / 90", value: aggregateMetrics.totalTackles.toFixed(1), icon: Shield, color: "#9334e6" },
                { label: "PRESSURES", value: aggregateMetrics.totalPressures.toFixed(1), icon: Activity, color: "#ea4335" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-xl p-3 border border-[--kw-border] bg-[--kw-surface-2] shadow-sm transition-all hover:border-[--kw-accent]"
                    style={{ borderLeftWidth: 3, borderLeftColor: m.color }}
                  >
                    <span
                      className="text-[9px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1"
                      style={{ color: m.color }}
                    >
                      <Icon className="h-3 w-3" />
                      {m.label}
                    </span>
                    <p className="mt-1 font-mono text-xl font-black" style={{ color: m.color }}>
                      {m.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* How-to hint */}
            <div
              className="rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 text-xs font-sans text-[--kw-text] leading-relaxed shadow-sm"
              style={{ borderLeftWidth: 4, borderLeftColor: "#4285f4" }}
            >
              <div className="flex items-center gap-1.5 font-semibold mb-1 text-[11px] text-[#4285f4]">
                <Info className="h-3.5 w-3.5" />
                Tactical What-If Simulation
              </div>
              Tap any player on the pitch to swap them with squad alternatives.
              The ML engine recalibrates xG, probabilities, and SHAP weights in real-time.
            </div>
          </MagicCard>

          {/* Simulate button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSimulate}
            disabled={isSimulating}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl py-3.5 font-semibold text-sm transition-all focus:outline-none shadow-lg",
              isSimulating
                ? "bg-[--kw-surface-2] text-[--kw-muted] cursor-not-allowed"
                : "text-white"
            )}
          >
            {!isSimulating && (
              <span className="absolute inset-0 animate-rgb-shimmer" aria-hidden />
            )}
            <span className="relative flex items-center justify-center gap-2">
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
                  Run Tactical Simulation
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Player Swap Modal */}
      <AnimatePresence>
        {selectedSlotIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[--kw-border] bg-[--kw-surface] p-5 shadow-2xl"
            >
              {/* Google RGB top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 flex rounded-t-2xl overflow-hidden">
                {["#4285f4", "#ea4335", "#fbbc04", "#34a853"].map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[--kw-border] pb-4 mt-1">
                <div>
                  <h3 className="text-base font-bold text-[--kw-text] flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-[#4285f4]" />
                    Select Replacement Player
                  </h3>
                  <p className="text-xs text-[--kw-muted] font-mono mt-0.5">
                    Slot #{selectedSlotIndex + 1} — {currentPreset.positions[selectedSlotIndex]?.role}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlotIndex(null)}
                  className="rounded-lg p-1.5 text-[--kw-muted] hover:bg-[--kw-surface-2] hover:text-[--kw-text] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative my-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--kw-muted]" />
                <input
                  type="text"
                  placeholder="Search by name or position (FWD, MID, DEF, GK)…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[--kw-border] bg-[--kw-surface-2] pl-10 pr-4 py-2.5 text-sm text-[--kw-text] placeholder-[--kw-muted] focus:border-[#4285f4] focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Roster list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
                {filteredRoster.map((player) => {
                  const style = POSITION_STYLES[player.position] || POSITION_STYLES.MID;
                  return (
                    <button
                      key={player.player_id}
                      onClick={() => handlePlayerSwap(player)}
                      className="w-full flex items-center justify-between rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 hover:border-[#4285f4] hover:bg-[--kw-accent-light] transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold border flex-shrink-0"
                          style={{ background: style.bg, color: style.text, borderColor: style.border }}
                        >
                          {player.position}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[--kw-text] group-hover:text-[#4285f4] transition-colors">
                            {player.player_name}
                          </p>
                          <p className="text-[10px] text-[--kw-muted] font-mono">
                            {player.team} · {player.minutes} mins
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] text-[--kw-muted] block uppercase">xG/90</span>
                          <span className="font-bold text-[#4285f4]">{formatXG(player.xg_90)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[--kw-muted] block uppercase">xA/90</span>
                          <span className="font-bold text-[#34a853]">{formatXG(player.xa_90)}</span>
                        </div>
                        <div className="text-right hidden sm:block">
                          <span className="text-[9px] text-[--kw-muted] block uppercase">Tackles</span>
                          <span className="font-bold text-[--kw-text]">{player.tackles_90?.toFixed(1) || "0.0"}</span>
                        </div>
                        <div className="rounded-lg bg-[--kw-surface-2] p-1.5 text-[--kw-muted] group-hover:bg-[#4285f4] group-hover:text-white transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredRoster.length === 0 && (
                  <div className="py-8 text-center text-sm font-sans text-[--kw-muted]">
                    No players found for "{searchQuery}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
