"use client";

import { Flame, Sparkles, Trophy } from "lucide-react";

interface PresetMatchup {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  tag: string;
}

const PRESET_MATCHUPS: PresetMatchup[] = [
  {
    id: "klassiker",
    name: "Der Klassiker",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    tag: "Title Fight",
  },
  {
    id: "top_spiel",
    name: "Champions Clash",
    homeTeam: "Bayer Leverkusen",
    awayTeam: "RB Leipzig",
    tag: "High Press Battle",
  },
  {
    id: "stuttgart_frankfurt",
    name: "European Contenders",
    homeTeam: "VfB Stuttgart",
    awayTeam: "Eintracht Frankfurt",
    tag: "Tactical Duel",
  },
  {
    id: "freiburg_hoffenheim",
    name: "Baden-Württemberg Derby",
    homeTeam: "SC Freiburg",
    awayTeam: "TSG Hoffenheim",
    tag: "Regional Rivalry",
  },
];

interface PresetMatchupsProps {
  onSelect: (home: string, away: string) => void;
}

export function PresetMatchups({ onSelect }: PresetMatchupsProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        <span>FEATURED BUNDESLIGA MATCHUPS:</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PRESET_MATCHUPS.map((matchup) => (
          <button
            key={matchup.id}
            onClick={() => onSelect(matchup.homeTeam, matchup.awayTeam)}
            className="group flex flex-col items-start justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 hover:border-cyan-500/50 hover:bg-zinc-900 transition-all text-left"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="font-mono text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                {matchup.tag}
              </span>
              <Flame className="h-3 w-3 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>

            <span className="font-mono text-xs font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors truncate w-full">
              {matchup.name}
            </span>

            <span className="font-mono text-[10px] text-zinc-500 mt-1 truncate w-full">
              {matchup.homeTeam} vs {matchup.awayTeam}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
