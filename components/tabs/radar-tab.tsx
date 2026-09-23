"use client";

import { Compass, Shield, Target, Activity, Flame, Zap, Layers } from "lucide-react";
import { RadarData } from "@/lib/validation";
import { OutputRadar } from "@/components/output-radar";
import { MagicCard } from "@/components/ui/magic-card";
import Text3DFlip from "@/components/ui/text-3d-flip";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

interface RadarTabProps {
  radar: RadarData;
  homeTeam: string;
  awayTeam: string;
}

const PILLAR_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#9334e6",
  "#f59e0b",
];

const TACTICAL_AXES_DETAILS = [
  {
    key: "attack",
    name: "Attack Output",
    icon: Target,
    desc: "Lineup xG/90, direct shot volume, and conversion efficiency.",
  },
  {
    key: "creation",
    name: "Chance Creation",
    icon: Flame,
    desc: "Expected assists (xA), key passes, and shot-creating actions.",
  },
  {
    key: "midfield_control",
    name: "Midfield Control",
    icon: Layers,
    desc: "Central progressive passing volume and territorial tilt.",
  },
  {
    key: "pressing",
    name: "Pressing Intensity",
    icon: Activity,
    desc: "High-block pressure triggers and final-third turnovers.",
  },
  {
    key: "defensive_stability",
    name: "Defensive Solidity",
    icon: Shield,
    desc: "Tackles, interceptions, clearances, and defensive block resilience.",
  },
  {
    key: "transition",
    name: "Transition Pace",
    icon: Zap,
    desc: "Progressive carry speed and direct counter-attack velocity.",
  },
];

export function RadarTab({ radar, homeTeam, awayTeam }: RadarTabProps) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Visual Radar Card */}
      <div className="lg:col-span-6">
        <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#fbbc04" className="p-4 sm:p-6 rounded-2xl border border-[--kw-border] bg-[--kw-surface] shadow-sm">
          <OutputRadar radar={radar} homeTeam={homeTeam} awayTeam={awayTeam} />
        </MagicCard>
      </div>

      {/* Right: Tactical Pillars Breakdown Card */}
      <div className="lg:col-span-6 rounded-2xl border border-[--kw-border] bg-[--kw-surface] p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="h-5 w-5 text-[#fbbc04]" />
          <Text3DFlip
            rotateDirection="top"
            staggerDuration={0.03}
            className="font-heading font-swanky text-lg sm:text-xl text-[--kw-heading] tracking-wide"
          >
            Tactical Pillars Breakdown
          </Text3DFlip>
        </div>

        {TACTICAL_AXES_DETAILS.map((pillar, i) => {
          const Icon = pillar.icon;
          const homeVal = (radar.home as any)?.[pillar.key] || 50;
          const awayVal = (radar.away as any)?.[pillar.key] || 50;
          const diff = Math.round(homeVal - awayVal);
          const color = PILLAR_COLORS[i % PILLAR_COLORS.length];

          return (
            <div
              key={pillar.key}
              className="p-3.5 rounded-xl border border-[--kw-border] bg-[--kw-surface-2] hover:bg-[--kw-surface-3] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-heading font-swanky text-xs font-semibold text-[--kw-text]">
                      {pillar.name}
                    </span>
                    <p className="text-[10px] text-[--kw-muted] font-sans">
                      {pillar.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0 ml-2">
                  <span className="font-bold text-[#4285f4]">
                    {Math.round(homeVal)}
                  </span>
                  <span className="text-[--kw-muted]">:</span>
                  <span className="font-bold text-[#34a853]">
                    {Math.round(awayVal)}
                  </span>
                </div>
              </div>

              {/* Differential bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[--kw-border] overflow-hidden flex">
                  <div
                    className="h-full rounded-l-full transition-all duration-500"
                    style={{
                      width: `${(homeVal / (homeVal + awayVal || 1)) * 100}%`,
                      background: "#4285f4",
                    }}
                  />
                  <div
                    className="h-full rounded-r-full transition-all duration-500"
                    style={{
                      width: `${(awayVal / (homeVal + awayVal || 1)) * 100}%`,
                      background: "#34a853",
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono text-[--kw-muted] whitespace-nowrap">
                  {diff > 0
                    ? `+${diff} ${homeTeam.split(" ")[0]}`
                    : diff < 0
                    ? `+${Math.abs(diff)} ${awayTeam.split(" ")[0]}`
                    : "Even"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
