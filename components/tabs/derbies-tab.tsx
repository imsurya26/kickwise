"use client";

import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { MagicCard } from "@/components/ui/magic-card";
import { Text3DFlip } from "@/components/ui/text-3d-flip";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

interface Derby {
  id: string;
  name: string;
  subtitle: string;
  homeTeam: string;
  awayTeam: string;
  tag: string;
  story: string;
  tagColor: string;
}

const BUNDESLIGA_DERBIES: Derby[] = [
  {
    id: "klassiker",
    name: "Der Klassiker",
    subtitle: "Germany's Greatest Modern Rivalry",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    tag: "Title Fight",
    story:
      "Harry Kane and Jamal Musiala face off against Serhou Guirassy and Julian Brandt in the ultimate battle for German dominance.",
    tagColor: "#4285f4",
  },
  {
    id: "top_spiel",
    name: "Champions Clash",
    subtitle: "High-Intensity Tactical Duel",
    homeTeam: "Bayer Leverkusen",
    awayTeam: "RB Leipzig",
    tag: "Tactical Masterclass",
    story:
      "Florian Wirtz and Granit Xhaka take on Leipzig's rapid counter-pressing system led by Xavi Simons and Loïs Openda.",
    tagColor: "#34a853",
  },
  {
    id: "stuttgart_frankfurt",
    name: "European Contenders",
    subtitle: "UEFA Champions League Showdown",
    homeTeam: "VfB Stuttgart",
    awayTeam: "Eintracht Frankfurt",
    tag: "Attacking Firepower",
    story:
      "Stuttgart's possession-heavy positional play meets Frankfurt's explosive transitional attack in a high-scoring thriller.",
    tagColor: "#ea4335",
  },
  {
    id: "freiburg_hoffenheim",
    name: "Baden-Württemberg Derby",
    subtitle: "Regional Showdown",
    homeTeam: "SC Freiburg",
    awayTeam: "TSG Hoffenheim",
    tag: "Regional Derby",
    story:
      "Freiburg's disciplined low-block and set-piece efficiency tests Hoffenheim's dynamic wide-channel crossing.",
    tagColor: "#fbbc04",
  },
];

interface DerbiesTabProps {
  onSelectMatchup: (home: string, away: string) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

export function DerbiesTab({
  onSelectMatchup,
  onSimulate,
  isSimulating,
}: DerbiesTabProps) {
  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Flame className="h-5 w-5 text-[#ea4335]" />
        <h1 className="text-xl font-heading font-swanky font-extrabold text-[--kw-text]">
          <Text3DFlip
            className="inline-block"
            textClassName="text-[--kw-text]"
            flipTextClassName="text-[--kw-text]"
            rotateDirection="top"
            staggerDuration={0.02}
          >
            Bundesliga Derby Quick-Launch
          </Text3DFlip>
        </h1>
      </div>
      <p className="text-sm text-[--kw-subtext] font-sans mb-4">
        Select a classic rivalry to instantly load it into the simulator and run a prediction.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {BUNDESLIGA_DERBIES.map((derby, i) => (
          <MagicCard
            key={derby.id}
            mode="orb"
            glowFrom={derby.tagColor}
            glowTo="#4285f4"
            className="p-5 flex flex-col justify-between group h-full"
          >
            <div>
              {/* Tag + Icon */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="kw-chip font-mono text-[9px]"
                  style={{
                    background: `${derby.tagColor}18`,
                    color: derby.tagColor,
                    borderColor: `${derby.tagColor}40`,
                  }}
                >
                  {derby.tag}
                </span>
                <Flame className="h-4 w-4" style={{ color: derby.tagColor }} />
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-[--kw-text] mb-0.5 font-heading font-swanky">
                <Text3DFlip
                  className="inline-block"
                  textClassName="text-[--kw-text]"
                  flipTextClassName="text-[--kw-text]"
                  rotateDirection="top"
                  staggerDuration={0.02}
                >
                  {derby.name}
                </Text3DFlip>
              </h3>
              <p className="text-xs text-[--kw-muted] font-mono mb-3">
                {derby.subtitle}
              </p>

              {/* Teams Banner */}
              <div className="flex items-center justify-between rounded-xl border border-[--kw-border] bg-[--kw-surface-2] px-4 py-3 font-sans text-sm mb-3">
                <span className="font-bold text-[#4285f4] truncate max-w-[110px]">
                  {derby.homeTeam}
                </span>
                <span className="text-[--kw-muted] text-xs font-semibold uppercase px-2">
                  vs
                </span>
                <span className="font-bold text-[#34a853] truncate max-w-[110px] text-right">
                  {derby.awayTeam}
                </span>
              </div>

              {/* Story */}
              <p className="text-xs text-[--kw-subtext] font-sans leading-relaxed mb-4">
                {derby.story}
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onSelectMatchup(derby.homeTeam, derby.awayTeam)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[--kw-border] bg-[--kw-surface-2] hover:bg-[--kw-accent-light] px-4 py-2.5 text-sm font-semibold text-[--kw-text] hover:text-[#4285f4] hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm group-hover:scale-[1.01]"
            >
              Load Derby
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </MagicCard>
        ))}
      </div>
    </div>
  );
}
