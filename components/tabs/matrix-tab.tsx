"use client";

import { Grid, Sparkles, Trophy } from "lucide-react";
import { ScorelineProbability } from "@/lib/validation";
import { ScorelineMatrix } from "@/components/scoreline-matrix";
import { MagicCard } from "@/components/ui/magic-card";
import Text3DFlip from "@/components/ui/text-3d-flip";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

interface MatrixTabProps {
  scorelineProbabilities: ScorelineProbability[];
  homeTeam: string;
  awayTeam: string;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
}

export function MatrixTab({
  scorelineProbabilities,
  homeTeam,
  awayTeam,
  expectedHomeGoals,
  expectedAwayGoals,
}: MatrixTabProps) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Interactive Heatmap */}
      <div className="lg:col-span-7">
        <MagicCard mode="orb" glowFrom="#34a853" glowTo="#4285f4" className="p-1">
          <ScorelineMatrix
            scorelineProbabilities={scorelineProbabilities}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </MagicCard>
      </div>

      {/* Right: Poisson Model Insights */}
      <div className="lg:col-span-5 space-y-4">
        {/* Formula Card */}
        <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#34a853" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#4285f4]" />
            <Text3DFlip
              rotateDirection="top"
              staggerDuration={0.03}
              className="font-heading font-swanky text-base sm:text-lg text-[--kw-heading] tracking-wide"
            >
              Bivariate Poisson Modeling
            </Text3DFlip>
          </div>

          <p className="text-xs text-[--kw-subtext] font-sans leading-relaxed mb-4">
            KICKWISE models goal occurrences as independent Poisson processes conditioned
            on calibrated team attack/defence ratings and lineup adjustments.
          </p>

          {/* Formula block */}
          <div
            className="rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3.5 font-mono text-xs text-[#4285f4] space-y-1 mb-4 shadow-sm"
            style={{ borderLeftWidth: 4, borderLeftColor: "#4285f4" }}
          >
            <div className="text-[9px] text-[--kw-muted] uppercase mb-1">Formula:</div>
            <div>P(X=h, Y=a) =</div>
            <div className="pl-3">(e^-λh · λh^h / h!) ×</div>
            <div className="pl-3">(e^-λa · λa^a / a!)</div>
          </div>

          {/* Lambda values */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div
              className="rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: "#4285f4" }}
            >
              <span className="text-[9px] text-[--kw-muted] block uppercase mb-1">
                {homeTeam.split(" ")[0]} λ (Home)
              </span>
              <span className="font-bold text-[#4285f4] text-xl">
                {expectedHomeGoals.toFixed(2)}
              </span>
            </div>
            <div
              className="rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: "#34a853" }}
            >
              <span className="text-[9px] text-[--kw-muted] block uppercase mb-1">
                {awayTeam.split(" ")[0]} λ (Away)
              </span>
              <span className="font-bold text-[#34a853] text-xl">
                {expectedAwayGoals.toFixed(2)}
              </span>
            </div>
          </div>
        </MagicCard>

        {/* Clean Sheet Probabilities */}
        <MagicCard mode="orb" glowFrom="#34a853" glowTo="#0d7a2e" className="p-5 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-[#34a853]" />
            <Text3DFlip
              rotateDirection="top"
              className="font-heading font-swanky text-sm text-[--kw-text] tracking-wide"
            >
              Clean Sheet Probabilities
            </Text3DFlip>
            <span className="ml-auto text-[9px] text-[--kw-muted] uppercase">
              Poisson P(0)
            </span>
          </div>

          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: "#4285f4" }}
            >
              <span className="text-[--kw-subtext] font-sans text-xs">{homeTeam} Clean Sheet</span>
              <span className="font-bold text-[#4285f4] text-lg">
                {(Math.exp(-expectedAwayGoals) * 100).toFixed(1)}%
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3 shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: "#34a853" }}
            >
              <span className="text-[--kw-subtext] font-sans text-xs">{awayTeam} Clean Sheet</span>
              <span className="font-bold text-[#34a853] text-lg">
                {(Math.exp(-expectedHomeGoals) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </MagicCard>

        {/* BTTS Card */}
        <MagicCard mode="orb" glowFrom="#fbbc04" glowTo="#ea4335" className="p-5 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3">
            <Grid className="h-4 w-4 text-[#fbbc04]" />
            <Text3DFlip
              rotateDirection="top"
              className="font-heading font-swanky text-sm text-[--kw-text] tracking-wide"
            >
              Both Teams to Score
            </Text3DFlip>
          </div>
          <div className="text-center">
            <span className="font-black text-[#fbbc04] text-4xl">
              {(
                (1 - Math.exp(-expectedHomeGoals)) *
                (1 - Math.exp(-expectedAwayGoals)) *
                100
              ).toFixed(1)}%
            </span>
            <p className="text-[10px] text-[--kw-muted] font-sans mt-1">
              P(Home ≥ 1) × P(Away ≥ 1)
            </p>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
