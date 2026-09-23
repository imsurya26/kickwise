"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  TrendingUp,
  CheckCircle,
  Activity,
} from "lucide-react";
import { SimulationResult } from "@/lib/validation";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { MagicCard } from "@/components/ui/magic-card";
import Text3DFlip from "@/components/ui/text-3d-flip";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { formatProbability, formatXG } from "@/lib/utils";

interface ForecastTabProps {
  result: SimulationResult;
  homeTeam: string;
  awayTeam: string;
  onSimulate: () => void;
  isSimulating: boolean;
}

export function ForecastTab({
  result,
  homeTeam,
  awayTeam,
  onSimulate,
  isSimulating,
}: ForecastTabProps) {
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

  const dominantTitle =
    dominantTeam === "Draw"
      ? "Projected Tactical Draw"
      : `${dominantTeam} Favored to Win`;

  const dominantColor =
    dominantTeam === homeTeam
      ? "#4285f4"
      : dominantTeam === "Draw"
      ? "#5f6484"
      : "#34a853";

  return (
    <div className="w-full space-y-5">
      {/* Primary Outcome Banner wrapped in 3D Card Container & MagicCard */}
      <CardContainer className="w-full" containerClassName="w-full">
        <CardBody className="w-full">
          <MagicCard
            mode="orb"
            glowFrom="#4285f4"
            glowTo="#34a853"
            className="p-5 sm:p-7 w-full"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <CardItem translateZ={30} className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="kw-chip kw-chip-blue">XGBoost Multiclass</span>
                  <span className="text-[10px] font-mono text-[--kw-muted]">
                    {result.model_version} · {result.duration_ms}ms
                  </span>
                </CardItem>

                <CardItem translateZ={60} className="mb-2">
                  <Text3DFlip
                    rotateDirection="top"
                    staggerDuration={0.03}
                    className="font-heading font-swanky text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide"
                    textClassName="font-heading font-swanky font-bold"
                    style={{ color: dominantColor } as any}
                  >
                    {dominantTitle}
                  </Text3DFlip>
                </CardItem>

                <CardItem translateZ={40} as="p" className="text-xs text-[--kw-subtext] font-sans max-w-lg leading-relaxed">
                  Based on position-weighted Starting XI metrics, 5-season rolling
                  form, and Bivariate Poisson goal simulations.
                </CardItem>
              </div>

              {/* Score + Confidence */}
              <CardItem translateZ={70}>
                <div className="flex items-center gap-4 bg-[--kw-surface-2] border border-[--kw-border] rounded-2xl px-5 py-3.5 shadow-sm flex-shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-[--kw-muted] uppercase tracking-wider block mb-1">
                      Predicted Score
                    </span>
                    <span className="font-mono text-3xl font-black text-[#4285f4]">
                      {result.predicted_score}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-[--kw-border]" />
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-[--kw-muted] uppercase tracking-wider block mb-1">
                      Confidence
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#34a853]">
                      {Math.round(maxProb * 100)}%
                    </span>
                  </div>
                </div>
              </CardItem>
            </div>
          </MagicCard>
        </CardBody>
      </CardContainer>

      {/* Probability Gauges with 3D Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Home Win */}
        <CardContainer className="w-full" containerClassName="w-full">
          <CardBody className="w-full">
            <MagicCard
              mode="orb"
              glowFrom="#4285f4"
              glowTo="#1a73e8"
              className="flex flex-col items-center p-5 sm:p-7 w-full"
            >
              <div className="w-full flex items-center justify-between mb-4">
                <CardItem translateZ={40}>
                  <Text3DFlip
                    rotateDirection="top"
                    className="font-heading font-swanky text-base font-semibold text-[#4285f4] truncate"
                  >
                    {homeTeam}
                  </Text3DFlip>
                </CardItem>
                <CardItem translateZ={30}>
                  <span className="kw-chip kw-chip-blue">HOME</span>
                </CardItem>
              </div>

              <CardItem translateZ={60}>
                <AnimatedCircularProgressBar
                  value={Math.round(result.home_win_probability * 100)}
                  gaugePrimaryColor="#4285f4"
                  label="HOME WIN"
                  size={150}
                  strokeWidth={11}
                />
              </CardItem>

              <CardItem translateZ={30} className="mt-5 w-full flex items-center justify-between pt-3 border-t border-[--kw-border] text-xs text-[--kw-subtext]">
                <span className="font-mono uppercase text-[10px]">Expected Goals</span>
                <span className="font-bold text-[#4285f4] font-mono">
                  {formatXG(result.expected_home_goals)} xG
                </span>
              </CardItem>
            </MagicCard>
          </CardBody>
        </CardContainer>

        {/* Draw */}
        <CardContainer className="w-full" containerClassName="w-full">
          <CardBody className="w-full">
            <MagicCard
              mode="orb"
              glowFrom="#fbbc04"
              glowTo="#ea4335"
              className="flex flex-col items-center p-5 sm:p-7 w-full"
            >
              <div className="w-full flex items-center justify-between mb-4">
                <CardItem translateZ={40}>
                  <Text3DFlip
                    rotateDirection="top"
                    className="font-heading font-swanky text-base font-semibold text-[#f59e0b]"
                  >
                    Draw
                  </Text3DFlip>
                </CardItem>
                <CardItem translateZ={30}>
                  <span className="kw-chip" style={{ background: "rgba(251,191,36,0.15)", color: "#d97706", borderColor: "rgba(251,191,36,0.3)" }}>
                    STALEMATE
                  </span>
                </CardItem>
              </div>

              <CardItem translateZ={60}>
                <AnimatedCircularProgressBar
                  value={Math.round(result.draw_probability * 100)}
                  gaugePrimaryColor="#fbbc04"
                  label="DRAW"
                  size={150}
                  strokeWidth={11}
                />
              </CardItem>

              <CardItem translateZ={30} className="mt-5 w-full flex items-center justify-between pt-3 border-t border-[--kw-border] text-xs text-[--kw-subtext]">
                <span className="font-mono uppercase text-[10px]">Draw Density</span>
                <span className="font-bold text-[#f59e0b] font-mono">
                  {formatProbability(result.draw_probability)}
                </span>
              </CardItem>
            </MagicCard>
          </CardBody>
        </CardContainer>

        {/* Away Win */}
        <CardContainer className="w-full" containerClassName="w-full">
          <CardBody className="w-full">
            <MagicCard
              mode="orb"
              glowFrom="#34a853"
              glowTo="#0d7a2e"
              className="flex flex-col items-center p-5 sm:p-7 w-full"
            >
              <div className="w-full flex items-center justify-between mb-4">
                <CardItem translateZ={40}>
                  <Text3DFlip
                    rotateDirection="top"
                    className="font-heading font-swanky text-base font-semibold text-[#34a853] truncate"
                  >
                    {awayTeam}
                  </Text3DFlip>
                </CardItem>
                <CardItem translateZ={30}>
                  <span className="kw-chip kw-chip-green">AWAY</span>
                </CardItem>
              </div>

              <CardItem translateZ={60}>
                <AnimatedCircularProgressBar
                  value={Math.round(result.away_win_probability * 100)}
                  gaugePrimaryColor="#34a853"
                  label="AWAY WIN"
                  size={150}
                  strokeWidth={11}
                />
              </CardItem>

              <CardItem translateZ={30} className="mt-5 w-full flex items-center justify-between pt-3 border-t border-[--kw-border] text-xs text-[--kw-subtext]">
                <span className="font-mono uppercase text-[10px]">Expected Goals</span>
                <span className="font-bold text-[#34a853] font-mono">
                  {formatXG(result.expected_away_goals)} xG
                </span>
              </CardItem>
            </MagicCard>
          </CardBody>
        </CardContainer>
      </div>

      {/* xG Balance Bar */}
      <CardContainer className="w-full" containerClassName="w-full">
        <CardBody className="w-full">
          <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#34a853" className="p-5 w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[--kw-text] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#4285f4]" />
                <Text3DFlip
                  rotateDirection="top"
                  className="font-sans font-semibold text-sm text-[--kw-text]"
                >
                  Expected Goals (xG) Balance
                </Text3DFlip>
              </span>
              <span className="text-xs font-mono text-[--kw-subtext]">
                Net: {(result.expected_home_goals - result.expected_away_goals).toFixed(2)} xG
              </span>
            </div>

            <div className="relative h-4 w-full rounded-full bg-[--kw-surface-2] overflow-hidden border border-[--kw-border] flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(result.expected_home_goals / (result.expected_home_goals + result.expected_away_goals || 1)) * 100}%`,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full bg-[#4285f4] rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(result.expected_away_goals / (result.expected_home_goals + result.expected_away_goals || 1)) * 100}%`,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full bg-[#34a853] rounded-r-full"
              />
            </div>

            <div className="flex items-center justify-between font-mono text-xs text-[--kw-subtext] mt-2">
              <span className="text-[#4285f4] font-semibold">
                {homeTeam} ({result.expected_home_goals.toFixed(2)} xG)
              </span>
              <span className="text-[#34a853] font-semibold">
                {awayTeam} ({result.expected_away_goals.toFixed(2)} xG)
              </span>
            </div>
          </MagicCard>
        </CardBody>
      </CardContainer>
    </div>
  );
}
