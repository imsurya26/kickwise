"use client";

import { useMemo } from "react";
import { Grid, Trophy } from "lucide-react";
import { ScorelineProbability } from "@/lib/validation";
import { cn, formatProbability } from "@/lib/utils";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

interface ScorelineMatrixProps {
  scorelineProbabilities: ScorelineProbability[];
  homeTeam: string;
  awayTeam: string;
}

export function ScorelineMatrix({
  scorelineProbabilities = [],
  homeTeam,
  awayTeam,
}: ScorelineMatrixProps) {
  // Build 6x6 grid
  const matrix = useMemo(() => {
    const grid: number[][] = Array.from({ length: 6 }, () =>
      Array.from({ length: 6 }, () => 0)
    );
    scorelineProbabilities.forEach((item) => {
      if (
        item.home_goals >= 0 &&
        item.home_goals < 6 &&
        item.away_goals >= 0 &&
        item.away_goals < 6
      ) {
        grid[item.home_goals][item.away_goals] = item.probability;
      }
    });
    return grid;
  }, [scorelineProbabilities]);

  const maxProb = useMemo(() => {
    let max = 0.001;
    matrix.forEach((row) => row.forEach((val) => { if (val > max) max = val; }));
    return max;
  }, [matrix]);

  const topScorelines = useMemo(
    () =>
      [...scorelineProbabilities]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5),
    [scorelineProbabilities]
  );

  return (
    <div className="google-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[--kw-border]">
        <div className="flex items-center gap-2">
          <Grid className="h-4 w-4 text-[#34a853]" />
          <DiaTextReveal
            text="Bivariate Poisson Score Matrix"
            className="text-sm font-bold"
            gradientClassName="from-[#34a853] via-[#1e8e3e] to-[#4285f4]"
            delay={0.04}
          />
        </div>
        <span className="text-[9px] font-mono text-[--kw-muted] uppercase tracking-wider">
          0–5 Goal Density
        </span>
      </div>

      {/* Matrix grid */}
      <div className="w-full flex flex-col items-center">
        {/* Away team label */}
        <div className="w-full flex items-center justify-center font-mono text-[10px] text-[#34a853] font-semibold mb-1.5">
          {awayTeam.toUpperCase()} (AWAY GOALS →)
        </div>

        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[280px] flex flex-col gap-1">
            {/* Column headers */}
            <div className="grid grid-cols-7 gap-1 font-mono text-[10px] text-[--kw-muted] text-center">
              <span className="text-[9px] text-[#4285f4] font-semibold">H\A</span>
              {[0, 1, 2, 3, 4, 5].map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>

            {/* Matrix rows */}
            {matrix.map((row, homeGoals) => (
              <div key={homeGoals} className="grid grid-cols-7 gap-1 font-mono text-[10px]">
                {/* Home row index */}
                <div className="flex items-center justify-center font-semibold text-[#4285f4]">
                  {homeGoals}
                </div>

                {/* Score cells */}
                {row.map((prob, awayGoals) => {
                  const intensity = Math.min(prob / maxProb, 1);
                  const isTopPick =
                    topScorelines[0]?.home_goals === homeGoals &&
                    topScorelines[0]?.away_goals === awayGoals;
                  const isHighProb = prob > 0.05;

                  return (
                    <div
                      key={awayGoals}
                      title={`${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam}: ${formatProbability(prob)}`}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-lg p-2 transition-all cursor-pointer hover:scale-105 border text-[10px]",
                        isTopPick
                          ? "border-[#4285f4] bg-blue-100 text-[#4285f4] font-bold shadow-sm shadow-blue-200"
                          : isHighProb
                          ? "border-blue-200 text-[#1a73e8] font-medium"
                          : "border-[--kw-border-dim] text-[--kw-muted]"
                      )}
                      style={{
                        backgroundColor:
                          !isTopPick && prob > 0
                            ? `rgba(66, 133, 244, ${Math.max(intensity * 0.18, 0.04)})`
                            : undefined,
                      }}
                    >
                      {(prob * 100).toFixed(1)}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Home team label (left side implied by row numbers) */}
        <div className="w-full flex items-center justify-start font-mono text-[10px] text-[#4285f4] font-semibold mt-1.5 pl-2">
          {homeTeam.toUpperCase()} (HOME GOALS ↓)
        </div>
      </div>

      {/* Top 5 ranked scorelines */}
      <div className="mt-4 pt-4 border-t border-[--kw-border]">
        <span className="font-mono text-[10px] text-[--kw-muted] uppercase tracking-wider block mb-2.5">
          Top Likely Outcomes
        </span>
        <div className="flex flex-wrap gap-2">
          {topScorelines.map((item, i) => (
            <div
              key={item.scoreline}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs border",
                i === 0
                  ? "border-blue-300 bg-blue-100 text-[#4285f4] font-bold shadow-sm"
                  : "border-[--kw-border] bg-[--kw-surface-2] text-[--kw-subtext]"
              )}
            >
              <span className="text-[--kw-muted] text-[9px]">#{i + 1}</span>
              <span>{item.scoreline}</span>
              <span className="text-[--kw-muted] text-[10px]">
                ({formatProbability(item.probability)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
