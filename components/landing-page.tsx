"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Activity,
  BarChart3,
  Flame,
  PieChart,
  Target,
  Compass,
  Database,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  Workflow,
  Share2,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { HeroParallax, HeroProduct } from "@/components/ui/hero-parallax";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { Text3DFlip } from "@/components/ui/text-3d-flip";
import { KickwiseLightArchitecture } from "@/components/ui/kickwise-light-architecture";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { BorderMagicButton } from "@/components/ui/border-magic-button";
import { TabType } from "@/components/sidebar";
import { useTheme } from "next-themes";

interface LandingPageProps {
  onEnterSimulator: (tab?: TabType) => void;
}

export function LandingPage({ onEnterSimulator }: LandingPageProps) {
  const { resolvedTheme } = useTheme();

  const authorTeam = [
    {
      id: 1,
      name: "SURYA S",
      role: "Lead AI & Full-Stack Architect",
      designation: "Lead AI & Full-Stack Architect",
      image: "/authors/author1.png",
      bio: "Specializing in deep learning, XGBoost probability calibration, and reactive Next.js telemetry architectures.",
      tags: ["XGBoost Ensemble", "Next.js 15", "FastAPI", "Tactical Physics"],
    },
    {
      id: 2,
      name: "VISHAL A",
      role: "Data Scientist & ML Engineer",
      designation: "Data Scientist & ML Engineer",
      image: "/authors/author2.png",
      bio: "Focusing on Bivariate Poisson regressions, per-90 Kaggle ETL pipelines, and SHAP explainability synthesis.",
      tags: ["Bivariate Poisson", "SHAP TreeExplainer", "Kaggle ETL", "Supabase RLS"],
    },
  ];

  const showcaseProducts: HeroProduct[] = [
    /* ── Row 1 (items 0–4) ── */
    {
      title: "Tactical Pitch & Lineups",
      link: "#",
      category: "Tactical Simulator",
      badge: "4-3-3 / 4-2-3-1",
      description: "Interactive draggable player nodes with dynamic formation recalculation and real-time positional physics.",
      thumbnail: "/screenshots/main_simulator_dark_1790013749731.png",
      onClick: () => onEnterSimulator("simulator"),
    },
    {
      title: "XGBoost Match Forecast",
      link: "#",
      category: "ML Inference",
      badge: "62% Accuracy",
      description: "3-class calibrated outcome probabilities (Home / Draw / Away) weighted by per-90 player metrics.",
      thumbnail: "/screenshots/forecast_tab_dark_1790013777733.png",
      onClick: () => onEnterSimulator("forecast"),
    },
    {
      title: "Tactical Hexagon Radar",
      link: "#",
      category: "Telemetry Analysis",
      badge: "6 Pillars",
      description: "Comparative visual polygon measuring Attack xG, Def. Stability, High Press, Ball Retention, and Progression.",
      thumbnail: "/screenshots/radar_tab_dark_1790013797405.png",
      onClick: () => onEnterSimulator("radar"),
    },
    {
      title: "Bivariate Poisson 6×6 Matrix",
      link: "#",
      category: "Goal Probabilities",
      badge: "36 Scorelines",
      description: "Exact joint distribution of match scorelines, Clean Sheet probabilities, and Both Teams to Score (BTTS).",
      thumbnail: "/screenshots/matrix_tab_dark_1790013819002.png",
      onClick: () => onEnterSimulator("matrix"),
    },
    {
      title: "SHAP Feature Attribution",
      link: "#",
      category: "Explainable AI",
      badge: "TreeExplainer",
      description: "Waterfall breakdown of decisive tactical drivers and automated plain-English tactical narratives.",
      thumbnail: "/screenshots/shap_tab_dark_1790013839901.png",
      onClick: () => onEnterSimulator("explain"),
    },

    /* ── Row 2 (items 5–9) ── */
    {
      title: "Model Telemetry Dashboard",
      link: "#",
      category: "ML Performance",
      badge: "TimeSeriesSplit CV",
      description: "ROC-AUC (71%), Macro F1 (63%), Brier Score calibration, and feature importance rankings.",
      thumbnail: "/screenshots/model_tab_dark_1790013868346.png",
      onClick: () => onEnterSimulator("model"),
    },
    {
      title: "Bundesliga Derby Quick-Launch",
      link: "#",
      category: "Preset Rivalries",
      badge: "Der Klassiker",
      description: "One-click load for iconic clashes: Bayern vs. Dortmund, Leverkusen vs. Leipzig, Stuttgart vs. Frankfurt.",
      thumbnail: "/screenshots/derbies_tab_dark_1790013890427.png",
      onClick: () => onEnterSimulator("derbies"),
    },
    {
      title: "Real-Time Simulation Pop-Up",
      link: "#",
      category: "Interactive Modal",
      badge: "Pipeline Stages",
      description: "Authentic multi-stage ML calculation delay with projected scoreline reveal and confetti feedback.",
      thumbnail: "/screenshots/simulation_modal_dark_1790013963088.png",
      onClick: () => onEnterSimulator("forecast"),
    },
    {
      title: "Score Matrix Probability Grid",
      link: "#",
      category: "Goal Probabilities",
      badge: "Poisson Grid",
      description: "Per-cell joint-probability heatmap rendered from Bivariate Poisson λ parameters computed at simulation time.",
      thumbnail: "/screenshots/score_matrix_tab_1790003281135.png",
      onClick: () => onEnterSimulator("matrix"),
    },
    {
      title: "Pitch Dark Mode View",
      link: "#",
      category: "Tactical Simulator",
      badge: "Dark UI",
      description: "Full dark-mode tactical pitch showing player positioning heatmaps and real-time formation dragging.",
      thumbnail: "/screenshots/pitch_dark_mode_fixed_1790012473786.png",
      onClick: () => onEnterSimulator("simulator"),
    },

    /* ── Row 3 (items 10–14) ── */
    {
      title: "SHAP Explainability Deep-Dive",
      link: "#",
      category: "XAI Analysis",
      badge: "SHAP Values",
      description: "Per-feature Shapley force plots revealing how each tactical input drives the final outcome probability.",
      thumbnail: "/screenshots/shap_dark_mode_fixed_1790012441556.png",
      onClick: () => onEnterSimulator("explain"),
    },
    {
      title: "Simulation Result Reveal",
      link: "#",
      category: "Match Simulation",
      badge: "Live Output",
      description: "Animated scoreline reveal after multi-stage ML pipeline completes — including projected winner banner.",
      thumbnail: "/screenshots/simulation_result_1790000777373.png",
      onClick: () => onEnterSimulator("forecast"),
    },
    {
      title: "Forecast Tab — Win Probabilities",
      link: "#",
      category: "ML Inference",
      badge: "3-Class XGB",
      description: "Circular gauge probability readout with Home / Draw / Away confidence ring, xG balance bar, and live calibration.",
      thumbnail: "/screenshots/forecast_tab_1790044148740.png",
      onClick: () => onEnterSimulator("forecast"),
    },
    {
      title: "Derbies — Preset Clashes",
      link: "#",
      category: "Preset Rivalries",
      badge: "Bundesliga",
      description: "Curated pre-loaded matchups with historically accurate starting XIs for the most iconic German derbies.",
      thumbnail: "/screenshots/derbies_tab_1790044184771.png",
      onClick: () => onEnterSimulator("derbies"),
    },
    {
      title: "Tactical Radar Polygon",
      link: "#",
      category: "Telemetry Analysis",
      badge: "6 Axes",
      description: "Full-color comparative hexagon radar overlaying Home vs Away team across 6 tactical performance pillars.",
      thumbnail: "/screenshots/tactical_radar_polygon_1790000214418.png",
      onClick: () => onEnterSimulator("radar"),
    },
  ];

  return (
    <AuroraBackground className="overflow-x-hidden">
      {/* 1. Hero Parallax Showcase */}
      <HeroParallax
        products={showcaseProducts}
        onLaunch={() => onEnterSimulator("simulator")}
      />

      {/* 2. Project Summary Section with 3D Cards */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-[#4285f4] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            PROJECT PHILOSOPHY & CAPABILITIES
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-swanky text-[--kw-text]">
            <Text3DFlip
              className="inline-block"
              textClassName="text-[--kw-text]"
              flipTextClassName="text-[#4285f4]"
              rotateDirection="top"
              staggerDuration={0.02}
            >
              Executive Project Summary
            </Text3DFlip>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[--kw-subtext] font-sans mt-3">
            KICKWISE bridges the gap between raw optical match tracking and actionable tactical decision-making through explainable machine learning.
          </p>
        </div>

        {/* 3D Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Problem Statement */}
          <CardContainer className="inter-var w-full">
            <CardBody className="bg-[--kw-surface] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.15] border border-[--kw-border] w-full h-full rounded-3xl p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#4285f4]">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="kw-chip kw-chip-blue font-mono text-[9px]">The Challenge</span>
                </div>

                <CardItem
                  translateZ="50"
                  className="text-lg font-bold font-swanky text-[--kw-text]"
                >
                  Static Post-Match Analytics
                </CardItem>
                <CardItem
                  as="p"
                  translateZ="60"
                  className="text-[--kw-subtext] text-xs font-sans mt-2.5 leading-relaxed"
                >
                  Traditional football analytics platforms only present retrospective stats after full-time whistle. Coaches and analysts cannot test tactical "What-If" scenarios before kickoff.
                </CardItem>
                <CardItem translateZ="80" className="w-full mt-4">
                  <div className="rounded-2xl overflow-hidden border border-[--kw-border] bg-[--kw-surface-2] p-4 text-xs font-mono text-[--kw-muted]">
                    <div className="text-red-500 font-semibold mb-1">✗ Traditional Limitations:</div>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>No tactical substitution simulation</li>
                      <li>Black-box predictions without reasoning</li>
                      <li>Isolated single-match tables</li>
                    </ul>
                  </div>
                </CardItem>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[--kw-border]">
                <span className="text-[11px] font-mono text-[--kw-muted]">Problem Domain</span>
                <CardItem
                  translateZ={30}
                  as="button"
                  onClick={() => onEnterSimulator("simulator")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-[#4285f4] text-xs font-semibold transition-colors"
                >
                  Explore Solution →
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>

          {/* Card 2: The KICKWISE Solution */}
          <CardContainer className="inter-var w-full">
            <CardBody className="bg-[--kw-surface] relative group/card hover:shadow-2xl hover:shadow-green-500/[0.15] border border-[--kw-border] w-full h-full rounded-3xl p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[#34a853]">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="kw-chip kw-chip-green font-mono text-[9px]">The Innovation</span>
                </div>

                <CardItem
                  translateZ="50"
                  className="text-lg font-bold font-swanky text-[--kw-text]"
                >
                  Deterministic Tactical What-If
                </CardItem>
                <CardItem
                  as="p"
                  translateZ="60"
                  className="text-[--kw-subtext] text-xs font-sans mt-2.5 leading-relaxed"
                >
                  Instantly manipulate 11v11 starting lineups, switch formations, and simulate tactical matchups with live probability recalibration in sub-50 milliseconds.
                </CardItem>
                <CardItem translateZ="80" className="w-full mt-4">
                  <div className="rounded-2xl overflow-hidden border border-[--kw-border] bg-[--kw-surface-2] p-4 text-xs font-mono text-[--kw-muted]">
                    <div className="text-green-600 font-semibold mb-1">✓ KICKWISE Capabilities:</div>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>Real-time player node tactical physics</li>
                      <li>Bivariate Poisson 6×6 scoreline matrix</li>
                      <li>Interactive 6-pillar tactical radar</li>
                    </ul>
                  </div>
                </CardItem>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[--kw-border]">
                <span className="text-[11px] font-mono text-[--kw-muted]">Engine Speed</span>
                <CardItem
                  translateZ={30}
                  as="button"
                  onClick={() => onEnterSimulator("radar")}
                  className="px-3.5 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-[#34a853] text-xs font-semibold transition-colors"
                >
                  View Radar →
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>

          {/* Card 3: Explainable Machine Learning */}
          <CardContainer className="inter-var w-full">
            <CardBody className="bg-[--kw-surface] relative group/card hover:shadow-2xl hover:shadow-purple-500/[0.15] border border-[--kw-border] w-full h-full rounded-3xl p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#9334e6]">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <span className="kw-chip kw-chip-purple font-mono text-[9px]">Explainable AI</span>
                </div>

                <CardItem
                  translateZ="50"
                  className="text-lg font-bold font-swanky text-[--kw-text]"
                >
                  SHAP Attribution & Reasoning
                </CardItem>
                <CardItem
                  as="p"
                  translateZ="60"
                  className="text-[--kw-subtext] text-xs font-sans mt-2.5 leading-relaxed"
                >
                  Never wonder why an outcome was predicted. TreeExplainer provides local Shapley feature attributions and synthesizes plain-English tactical insights.
                </CardItem>
                <CardItem translateZ="80" className="w-full mt-4">
                  <div className="rounded-2xl overflow-hidden border border-[--kw-border] bg-[--kw-surface-2] p-4 text-xs font-mono text-[--kw-muted]">
                    <div className="text-purple-600 font-semibold mb-1">🔍 Explainability Stack:</div>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>TreeExplainer exact Shapley values</li>
                      <li>Primary tactical driver synthesis</li>
                      <li>Counter-signal and upset risk alerts</li>
                    </ul>
                  </div>
                </CardItem>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[--kw-border]">
                <span className="text-[11px] font-mono text-[--kw-muted]">XAI Pipeline</span>
                <CardItem
                  translateZ={30}
                  as="button"
                  onClick={() => onEnterSimulator("explain")}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-[#9334e6] text-xs font-semibold transition-colors"
                >
                  Inspect SHAP →
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>
        </div>
      </section>

      {/* 3. System Architecture Deep-Dive (Light Theme Bento Architecture) */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 py-16 border-t border-[--kw-border]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-[#34a853] mb-3">
            <Workflow className="h-3.5 w-3.5" />
            END-TO-END SYSTEM DESIGN
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-swanky text-[--kw-text]">
            <Text3DFlip
              className="inline-block"
              textClassName="text-[--kw-text]"
              flipTextClassName="text-[#34a853]"
              rotateDirection="top"
              staggerDuration={0.02}
            >
              System & Pipeline Architecture
            </Text3DFlip>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[--kw-subtext] font-sans mt-3">
            A high-throughput multi-tier architecture separating data ingestion, statistical modeling, inference caching, and UI telemetry.
          </p>
        </div>

        {/* Clean Light Theme Architecture Bento Diagram */}
        <div className="w-full">
          <KickwiseLightArchitecture />
        </div>
      </section>

      {/* 4. Aurora Motion Highlight Banner */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4 py-16 rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 via-white/80 to-white/90 dark:from-slate-900/80 dark:to-slate-950/90 shadow-xl backdrop-blur-sm"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-mono font-bold text-[#4285f4]">
            <Sparkles className="h-3.5 w-3.5" />
            AI-POWERED MATCH INTELLIGENCE
          </div>
          <div className="text-3xl md:text-6xl font-extrabold tracking-tight font-swanky text-slate-900 dark:text-white text-center max-w-4xl">
            Bundesliga Outcome AI & Real-Time Pitch Engine
          </div>
          <div className="font-light text-sm md:text-xl text-slate-600 dark:text-neutral-300 max-w-2xl py-2">
            Calibrated probabilistic forecasting, 6×6 bivariate scoreline matrices, and SHAP explainability.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <BorderMagicButton onClick={() => onEnterSimulator("simulator")}>
              <span className="font-mono text-sm tracking-wide">Enter Live Tactical Simulator →</span>
            </BorderMagicButton>
            <button
              onClick={() => onEnterSimulator("forecast")}
              className="bg-slate-900 dark:bg-white rounded-full font-mono text-xs font-medium text-white dark:text-slate-900 px-6 py-3 hover:opacity-90 transition-opacity shadow-md"
            >
              Inspect XGBoost Forecast
            </button>
          </div>
        </motion.div>
      </section>

      {/* 5. Authors & Core Engineering Team Section */}
      <section className="relative z-20 w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-8 sm:p-12 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-[#9334e6] mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            RESEARCH & ARCHITECTURE AUTHORS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-swanky text-slate-900 mb-2">
            Meet the Builders of KICKWISE
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-lg mx-auto mb-8">
            Engineered with deep learning, statistical regression models, and modern tactical telemetry.
          </p>

          {/* Animated Tooltip */}
          <div className="flex items-center justify-center mb-10">
            <AnimatedTooltip items={authorTeam} />
          </div>

          {/* Detailed Author Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {authorTeam.map((author) => (
              <div
                key={author.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="h-24 w-20 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-slate-200 group-hover:scale-105 transition-transform">
                  <img
                    src={author.image}
                    alt={author.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-swanky text-base font-bold text-slate-900 truncate">
                    {author.name}
                  </h3>
                  <span className="text-xs font-mono font-medium text-[#4285f4] block mb-1.5">
                    {author.role}
                  </span>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed mb-3">
                    {author.bio}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {author.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white border border-slate-200 text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-mono text-slate-400 mt-8 pt-6 border-t border-slate-100">
            <span>Machine Learning & Distributed Systems</span>
            <span>·</span>
            <span>Bundesliga Tactical Analytics</span>
          </div>
        </div>
      </section>

      {/* 6. Bottom Launch CTA with Border Magic Button */}
      <section className="relative z-20 w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-white to-white p-8 sm:p-12 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-bold font-swanky text-slate-900 mb-4">
            Ready to simulate your first Bundesliga match?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 font-sans mb-8">
            Experience real-time tactical manipulation, 6×6 scoreline probabilities, and explainable machine learning insights.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <BorderMagicButton onClick={() => onEnterSimulator("simulator")}>
              <span className="font-mono text-sm tracking-wide">LAUNCH TACTICAL SIMULATOR →</span>
            </BorderMagicButton>
            
            <button
              onClick={() => onEnterSimulator("derbies")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition-all shadow-sm"
            >
              <Flame className="h-4 w-4 text-[#ea4335]" />
              Explore Der Klassiker
            </button>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
