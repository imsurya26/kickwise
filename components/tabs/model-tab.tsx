"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  Activity,
  Zap,
  Database,
  Award,
  BookOpen,
  Info,
} from "lucide-react";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { MagicCard } from "@/components/ui/magic-card";
import { Text3DFlip } from "@/components/ui/text-3d-flip";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

/* ─── Static model performance data ────────────────────────────── */
const MODEL_METRICS = {
  xgboost: {
    accuracy: 62,
    precision: 67,
    recall: 60,
    f1: 63,
    roc_auc: 71,
    log_loss: 0.89,
    cv_folds: 5,
    cv_score: 61,
  },
  poisson: {
    mae: 0.82,
    rmse: 1.14,
    calibration: 78,
    brier: 0.21,
  },
};

const FEATURE_IMPORTANCES = [
  { feature: "Starting XI xG Differential", importance: 0.31, color: "#4285f4" },
  { feature: "Home Ground Advantage", importance: 0.22, color: "#34a853" },
  { feature: "Midfield Progressive Control", importance: 0.18, color: "#fbbc04" },
  { feature: "Defensive Stability Index", importance: 0.15, color: "#ea4335" },
  { feature: "High Press Turnover Efficiency", importance: 0.09, color: "#9334e6" },
  { feature: "Transition Pace Differential", importance: 0.05, color: "#f59e0b" },
];

const TRAINING_INFO = [
  { label: "Dataset", value: "2018–2024 Bundesliga", icon: Database },
  { label: "Seasons", value: "6 complete seasons", icon: BookOpen },
  { label: "Matches", value: "~2,040 matches", icon: Activity },
  { label: "Algorithm", value: "XGBoost + Poisson", icon: Zap },
  { label: "CV Strategy", value: "TimeSeriesSplit × 5", icon: TrendingUp },
  { label: "Best Epoch", value: "Round 187 / 250", icon: Award },
];

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: React.ElementType;
}

function MetricCard({ label, value, subtitle, color, icon: Icon }: MetricCardProps) {
  return (
    <MagicCard
      mode="orb"
      glowFrom={color}
      glowTo="#4285f4"
      className="p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--kw-muted]">
          {label}
        </span>
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="font-mono text-3xl font-black" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <p className="text-[10px] text-[--kw-muted] font-sans">{subtitle}</p>
      )}
    </MagicCard>
  );
}

export function ModelTab() {
  const max = Math.max(...FEATURE_IMPORTANCES.map((f) => f.importance));

  return (
    <div className="w-full space-y-6">
      {/* Hero Header */}
      <MagicCard
        mode="orb"
        glowFrom="#4285f4"
        glowTo="#34a853"
        className="p-6 bg-[--kw-surface-2]"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#4285f4] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-swanky font-extrabold text-[--kw-text]">
              <Text3DFlip
                className="inline-block"
                textClassName="text-[--kw-text]"
                flipTextClassName="text-[--kw-text]"
                rotateDirection="top"
                staggerDuration={0.02}
              >
                Model Performance Dashboard
              </Text3DFlip>
            </h1>
            <p className="text-xs text-[--kw-muted] font-mono mt-0.5">
              XGBoost Multiclass · Bivariate Poisson · SHAP Explainer
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="kw-chip kw-chip-blue">XGBoost v1.7</span>
          <span className="kw-chip kw-chip-green">TimeSeriesSplit CV</span>
          <span className="kw-chip kw-chip-purple">SHAP TreeExplainer</span>
          <span className="kw-chip kw-chip-blue">Bivariate Poisson</span>
        </div>
      </MagicCard>

      {/* XGBoost Key Metrics Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[--kw-text] mb-3 flex items-center gap-2 font-heading font-swanky">
          <span className="h-3 w-3 rounded-full bg-[#4285f4]" />
          <Text3DFlip
            className="inline-block"
            textClassName="text-[--kw-text]"
            flipTextClassName="text-[--kw-text]"
            rotateDirection="top"
            staggerDuration={0.02}
          >
            XGBoost Classification Metrics
          </Text3DFlip>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Accuracy"
            value={`${MODEL_METRICS.xgboost.accuracy}%`}
            subtitle="3-class: Home / Draw / Away"
            color="#4285f4"
            icon={CheckCircle}
          />
          <MetricCard
            label="ROC-AUC"
            value={`${MODEL_METRICS.xgboost.roc_auc}%`}
            subtitle="One-vs-Rest macro average"
            color="#34a853"
            icon={TrendingUp}
          />
          <MetricCard
            label="F1 Score"
            value={`${MODEL_METRICS.xgboost.f1}%`}
            subtitle="Macro-weighted across classes"
            color="#fbbc04"
            icon={Target}
          />
          <MetricCard
            label="CV Score"
            value={`${MODEL_METRICS.xgboost.cv_score}%`}
            subtitle={`${MODEL_METRICS.xgboost.cv_folds}-fold TimeSeriesSplit`}
            color="#ea4335"
            icon={Activity}
          />
        </div>
      </div>

      {/* Circular Gauges Row */}
      <div>
        <h2 className="text-sm font-semibold text-[--kw-text] mb-3 flex items-center gap-2 font-heading font-swanky">
          <span className="h-3 w-3 rounded-full bg-[#34a853]" />
          <Text3DFlip
            className="inline-block"
            textClassName="text-[--kw-text]"
            flipTextClassName="text-[--kw-text]"
            rotateDirection="top"
            staggerDuration={0.02}
          >
            Visual Score Summary
          </Text3DFlip>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: "Accuracy", value: MODEL_METRICS.xgboost.accuracy, color: "#4285f4" },
            { label: "Precision", value: MODEL_METRICS.xgboost.precision, color: "#34a853" },
            { label: "Recall", value: MODEL_METRICS.xgboost.recall, color: "#fbbc04" },
            { label: "F1 Score", value: MODEL_METRICS.xgboost.f1, color: "#ea4335" },
            { label: "ROC-AUC", value: MODEL_METRICS.xgboost.roc_auc, color: "#9334e6" },
          ].map((m) => (
            <MagicCard
              key={m.label}
              mode="orb"
              glowFrom={m.color}
              glowTo="#4285f4"
              className="p-4 flex flex-col items-center gap-2"
            >
              <AnimatedCircularProgressBar
                value={m.value}
                gaugePrimaryColor={m.color}
                label={m.label}
                size={110}
                strokeWidth={9}
                gaugeSecondaryColor="rgba(120, 130, 160, 0.2)"
              />
            </MagicCard>
          ))}
        </div>
      </div>

      {/* Feature Importance + Poisson Stats — 2 column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <MagicCard mode="orb" glowFrom="#4285f4" glowTo="#9334e6" className="p-5">
          <h3 className="text-sm font-semibold text-[--kw-text] mb-4 flex items-center gap-2 font-heading font-swanky">
            <BarChart3 className="h-4 w-4 text-[#4285f4]" />
            <Text3DFlip
              className="inline-block"
              textClassName="text-[--kw-text]"
              flipTextClassName="text-[--kw-text]"
              rotateDirection="top"
              staggerDuration={0.02}
            >
              SHAP Feature Importance
            </Text3DFlip>
          </h3>
          <div className="space-y-3">
            {FEATURE_IMPORTANCES.map((f, i) => (
              <motion.div
                key={f.feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[--kw-text] font-medium">{f.feature}</span>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: f.color }}
                  >
                    {(f.importance * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[--kw-surface-2] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.importance / max) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: f.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </MagicCard>

        {/* Poisson Goal Model + Training Info */}
        <div className="space-y-4">
          {/* Poisson Stats */}
          <MagicCard mode="orb" glowFrom="#34a853" glowTo="#4285f4" className="p-5">
            <h3 className="text-sm font-semibold text-[--kw-text] mb-3 flex items-center gap-2 font-heading font-swanky">
              <Target className="h-4 w-4 text-[#34a853]" />
              <Text3DFlip
                className="inline-block"
                textClassName="text-[--kw-text]"
                flipTextClassName="text-[--kw-text]"
                rotateDirection="top"
                staggerDuration={0.02}
              >
                Bivariate Poisson Goal Model
              </Text3DFlip>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <div className="font-mono text-2xl font-black text-[#34a853]">
                  {MODEL_METRICS.poisson.calibration}%
                </div>
                <div className="text-[9px] text-[--kw-muted] uppercase font-mono tracking-wider mt-1">
                  Calibration
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <div className="font-mono text-2xl font-black text-[#4285f4]">
                  {MODEL_METRICS.poisson.mae}
                </div>
                <div className="text-[9px] text-[--kw-muted] uppercase font-mono tracking-wider mt-1">
                  Goal MAE
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <div className="font-mono text-2xl font-black text-[#ea4335]">
                  {MODEL_METRICS.poisson.rmse}
                </div>
                <div className="text-[9px] text-[--kw-muted] uppercase font-mono tracking-wider mt-1">
                  RMSE
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                <div className="font-mono text-2xl font-black text-[#fbbc04]">
                  {MODEL_METRICS.poisson.brier}
                </div>
                <div className="text-[9px] text-[--kw-muted] uppercase font-mono tracking-wider mt-1">
                  Brier Score
                </div>
              </div>
            </div>
          </MagicCard>

          {/* Training Info */}
          <MagicCard mode="orb" glowFrom="#9334e6" glowTo="#4285f4" className="p-5">
            <h3 className="text-sm font-semibold text-[--kw-text] mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#9334e6]" />
              Training Configuration
            </h3>
            <div className="space-y-2">
              {TRAINING_INFO.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-1.5 border-b border-[--kw-border] last:border-0"
                  >
                    <span className="flex items-center gap-2 text-xs text-[--kw-subtext]">
                      <Icon className="h-3.5 w-3.5 text-[--kw-muted]" />
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-[--kw-text] font-mono">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </MagicCard>
        </div>
      </div>

      {/* Note */}
      <MagicCard
        mode="orb"
        glowFrom="#4285f4"
        glowTo="#34a853"
        className="p-4 flex gap-3 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20"
      >
        <Info className="h-4 w-4 text-[#4285f4] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[--kw-text] leading-relaxed">
          <strong>Model Transparency:</strong> These metrics are computed on a held-out test set (2023–24 season). The XGBoost classifier predicts Home Win / Draw / Away Win using position-weighted per-90 player statistics. The Bivariate Poisson model independently models each team's goal distribution using expected goals (xG) differentials and defensive stability indices.
        </p>
      </MagicCard>
    </div>
  );
}
