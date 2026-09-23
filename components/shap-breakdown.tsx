"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { ShapFeature } from "@/lib/validation";
import { cn, formatSHAP } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";

import { Text3DFlip } from "@/components/ui/text-3d-flip";

interface ShapBreakdownProps {
  shapFeatures: ShapFeature[];
  tacticalSummary: string;
}

export function ShapBreakdown({
  shapFeatures = [],
  tacticalSummary = "",
}: ShapBreakdownProps) {
  const sortedFeatures = [...shapFeatures].sort(
    (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
  );

  const maxAbsShap = Math.max(
    ...sortedFeatures.map((f) => Math.abs(f.shap_value)),
    0.01
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Plain-English Tactical Narrative */}
      <MagicCard mode="orb" glowFrom="#9334e6" glowTo="#4285f4" className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <BrainCircuit className="h-5 w-5 text-[#9334e6]" />
          <h2 className="font-heading font-swanky text-lg sm:text-xl text-[#9334e6] tracking-wide">
            <Text3DFlip
              className="inline-block"
              textClassName="text-[#9334e6]"
              flipTextClassName="text-[#9334e6]"
              rotateDirection="top"
              staggerDuration={0.02}
            >
              ML Tactical Analysis & Insights
            </Text3DFlip>
          </h2>
          <span className="kw-chip kw-chip-purple ml-auto font-mono text-[10px]">ML</span>
        </div>

        {tacticalSummary ? (
          <div className="rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-4 shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: "#9334e6" }}>
            <p className="whitespace-pre-line text-sm text-[--kw-text] font-sans leading-relaxed">
              {tacticalSummary}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[--kw-muted] font-mono">
            Simulation telemetry active. Run simulation to generate tactical breakdown.
          </p>
        )}
      </MagicCard>

      {/* SHAP Feature Contribution Waterfall */}
      <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#34a853" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[--kw-border]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-[#4285f4]" />
            <h3 className="font-heading font-swanky text-base sm:text-lg text-[--kw-text] tracking-wide">
              <Text3DFlip
                className="inline-block"
                textClassName="text-[--kw-text]"
                flipTextClassName="text-[--kw-text]"
                rotateDirection="top"
                staggerDuration={0.02}
              >
                SHAP Feature Attribution
              </Text3DFlip>
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-[#4285f4] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
              Favors Home (+)
            </span>
            <span className="flex items-center gap-1 text-[#ea4335] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#ea4335]" />
              Favors Away (-)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sortedFeatures.map((feat, index) => {
            const isPositive = feat.shap_value >= 0;
            const percentage = (Math.abs(feat.shap_value) / maxAbsShap) * 100;
            const barColor = isPositive ? "#4285f4" : "#ea4335";

            return (
              <motion.div
                key={feat.feature || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group relative flex flex-col gap-2 rounded-xl border border-[--kw-border] bg-[--kw-surface-2] p-3.5 transition-shadow hover:shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: barColor }}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5 text-[#4285f4] flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-[#ea4335] flex-shrink-0" />
                    )}
                    <span className="font-sans font-semibold text-[--kw-text]">
                      {feat.human_label || feat.feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[--kw-muted]">val: {feat.feature_value?.toFixed(2) ?? "—"}</span>
                    <span
                      className="font-bold px-2 py-0.5 rounded-md text-[10px]"
                      style={{
                        background: isPositive
                          ? "rgba(66,133,244,0.18)"
                          : "rgba(234,67,53,0.18)",
                        color: barColor,
                      }}
                    >
                      {formatSHAP(feat.shap_value)}
                    </span>
                  </div>
                </div>

                {/* Attribution Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percentage, 4)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="h-full rounded-full"
                    style={{ background: barColor }}
                  />
                </div>

                {/* Plain-English Tactical Implication */}
                <p className="text-[11px] text-[--kw-subtext] font-sans leading-relaxed">
                  {feat.tactical_interpretation || "High-impact tactical metric contributing to outcome estimation."}
                </p>
              </motion.div>
            );
          })}
        </div>
      </MagicCard>
    </div>
  );
}
