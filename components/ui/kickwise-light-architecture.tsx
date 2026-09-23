"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Database,
  Layers,
  Zap,
  Cpu,
  BarChart3,
  Sliders,
  ShieldCheck,
  Workflow,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  id: string;
  step: string;
  title: string;
  category: string;
  tag: string;
  tagColor: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  techStack: string[];
  metrics: { label: string; value: string }[];
  connections: string[];
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "data",
    step: "01",
    title: "Optical & Kaggle Match Ingestion",
    category: "Data Layer",
    tag: "ETL / Per-90",
    tagColor: "bg-blue-50 text-blue-600 border-blue-200",
    icon: Database,
    color: "#4285f4",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    description:
      "Ingests raw Bundesliga event logs, shots, key passes, pressing triggers, and xG data. Normalizes all player statistics to per-90 metrics.",
    techStack: ["Kaggle Bundesliga", "FBref Logs", "Pandas", "Z-Score Norm"],
    metrics: [
      { label: "Match Records", value: "3,060+" },
      { label: "Player Profiles", value: "850+" },
    ],
    connections: ["features"],
  },
  {
    id: "features",
    step: "02",
    title: "Tactical Feature Engineering",
    category: "Transformation",
    tag: "Position Weights",
    tagColor: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Sliders,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    description:
      "Computes tactical weighted matrices for 11v11 positions. Synthesizes home/away attack strength, defensive solidity, and transition pace indices.",
    techStack: ["Position Factors", "Rolling Form (5-Match)", "Elo Calibrations"],
    metrics: [
      { label: "Tactical Pillars", value: "6 Axes" },
      { label: "Feature Matrix", value: "48 Dims" },
    ],
    connections: ["ml"],
  },
  {
    id: "ml",
    step: "03",
    title: "XGBoost & Poisson ML Ensemble",
    category: "Inference Engine",
    tag: "Dual Modeling",
    tagColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: Cpu,
    color: "#34a853",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description:
      "Multiclass XGBoost predicts 3-way match probabilities (H/D/A) while Bivariate Poisson GLM generates the exact 6x6 scoreline probability distribution.",
    techStack: ["XGBoost 1.7", "Bivariate Poisson GLM", "5-Fold TimeSeries CV"],
    metrics: [
      { label: "CV Accuracy", value: "62.4%" },
      { label: "Inference Time", value: "< 35ms" },
    ],
    connections: ["gateway", "explain"],
  },
  {
    id: "explain",
    step: "04",
    title: "SHAP Explainability & Reasoning",
    category: "Explainable AI",
    tag: "TreeExplainer",
    tagColor: "bg-purple-50 text-purple-600 border-purple-200",
    icon: BrainCircuit,
    color: "#9334e6",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    description:
      "Calculates Shapley feature attributions to synthesize human-readable tactical narratives, key match drivers, and tactical mismatch alerts.",
    techStack: ["TreeExplainer", "Shapley Values", "Automated Tactical Insights"],
    metrics: [
      { label: "Explanation Speed", value: "< 15ms" },
      { label: "Attribution Faithfulness", value: "100%" },
    ],
    connections: ["ui"],
  },
  {
    id: "gateway",
    step: "05",
    title: "FastAPI Gateway & Client Telemetry",
    category: "API Layer",
    tag: "POST /simulate",
    tagColor: "bg-cyan-50 text-cyan-600 border-cyan-200",
    icon: Zap,
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    description:
      "High-speed asynchronous endpoints orchestrating lineup updates, tactical substitutions, and real-time simulation cache.",
    techStack: ["FastAPI", "Pydantic V2", "Next.js 15 Client", "TypeScript"],
    metrics: [
      { label: "Latency", value: "Sub-50ms" },
      { label: "Throughput", value: "850 req/s" },
    ],
    connections: ["ui", "storage"],
  },
  {
    id: "ui",
    step: "06",
    title: "Tactical Simulator UI & Output Layers",
    category: "Interactive Client",
    tag: "What-If Pitch",
    tagColor: "bg-rose-50 text-rose-600 border-rose-200",
    icon: BarChart3,
    color: "#ea4335",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    description:
      "Interactive 11v11 pitch formation drag-and-drop, 3D metric telemetry, radar polygon charts, and dynamic score probability heatmaps.",
    techStack: ["React 18", "Tailwind CSS", "Framer Motion", "Recharts"],
    metrics: [
      { label: "Sim Modes", value: "7 Tabs" },
      { label: "FPS", value: "60 FPS Native" },
    ],
    connections: ["storage"],
  },
  {
    id: "storage",
    step: "07",
    title: "Supabase PostgreSQL Telemetry",
    category: "Persistence",
    tag: "Audit Log",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-300",
    icon: ShieldCheck,
    color: "#059669",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description:
      "Persistent audit trail of user simulations, tactical parameter adjustments, and historical accuracy benchmarking with Row-Level Security.",
    techStack: ["Supabase", "PostgreSQL", "RLS Policies", "Telemetry Log"],
    metrics: [
      { label: "Storage Engine", value: "PostgreSQL 15" },
      { label: "Security", value: "RLS Enabled" },
    ],
    connections: [],
  },
];

export function KickwiseLightArchitecture() {
  const [activeStepId, setActiveStepId] = useState<string>("ml");
  const activeStep = PIPELINE_STEPS.find((s) => s.id === activeStepId) || PIPELINE_STEPS[2];

  return (
    <div className="w-full rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xl overflow-hidden p-6 sm:p-10">
      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50 px-3.5 py-1 text-xs font-mono font-semibold text-blue-600 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            KICKWISE MULTI-TIER SYSTEM ARCHITECTURE
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-swanky text-slate-900">
            End-to-End Machine Learning Pipeline
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-sans mt-1">
            Click any component node below to inspect its data contracts, algorithms, and latency telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
            FastAPI 0.111
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            XGBoost 1.7
          </span>
        </div>
      </div>

      {/* Main Architecture Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Pipeline Flow Navigation (7 Steps) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pipeline Stages (Click to inspect)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === activeStepId;
              return (
                <motion.button
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white shadow-lg border-slate-900 ring-2 ring-blue-500/30"
                      : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-800 border-slate-200/70"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center border",
                          isActive
                            ? "bg-white/10 border-white/20 text-white"
                            : `${step.bgColor} ${step.borderColor}`
                        )}
                        style={{ color: isActive ? "#ffffff" : step.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "font-mono text-xs font-bold",
                          isActive ? "text-slate-400" : "text-slate-400"
                        )}
                      >
                        {step.step}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                        isActive
                          ? "bg-white/15 text-white border-white/20"
                          : step.tagColor
                      )}
                    >
                      {step.tag}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={cn(
                        "font-heading font-swanky text-sm font-semibold mb-1 line-clamp-1",
                        isActive ? "text-white" : "text-slate-900"
                      )}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={cn(
                        "text-[11px] font-sans line-clamp-2 leading-relaxed",
                        isActive ? "text-slate-300" : "text-slate-500"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Component Live Telemetry Deep-Dive Card */}
        <div className="lg:col-span-5">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Selected Node Telemetry
          </div>

          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-md"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner border",
                    activeStep.bgColor,
                    activeStep.borderColor
                  )}
                  style={{ color: activeStep.color }}
                >
                  <activeStep.icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 block">
                    {activeStep.category} · Stage {activeStep.step}
                  </span>
                  <h4 className="font-heading font-swanky text-base font-bold text-slate-900">
                    {activeStep.title}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed mb-5">
              {activeStep.description}
            </p>

            {/* Metrics Showcase */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {activeStep.metrics.map((metric, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm"
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    {metric.label}
                  </span>
                  <span
                    className="font-mono text-base font-bold"
                    style={{ color: activeStep.color }}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Tech Stack Tags */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-2 font-medium">
                Integrated Frameworks & Standards
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeStep.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
