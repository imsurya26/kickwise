"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Zap } from "lucide-react";

interface ProcessingOverlayProps {
  isOpen?: boolean;
  isVisible?: boolean;
}

const SIMULATION_STEPS = [
  "Aggregating Starting XI Per-90 Telemetry…",
  "Calibrating Rolling Rest Days & H2H Multipliers…",
  "Running XGBoost 3-Class Outcome Estimator…",
  "Fitting Bivariate Poisson Scoreline Probability Grid…",
  "Extracting SHAP TreeExplainer Tactical Attributions…",
  "Synthesizing Plain-English Tactical Intelligence…",
];

const GOOGLE_COLORS = ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#9334e6", "#f59e0b"];

export function ProcessingOverlay({ isOpen, isVisible }: ProcessingOverlayProps) {
  const isShown = isOpen ?? isVisible ?? false;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isShown) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < SIMULATION_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 450);
    return () => clearInterval(interval);
  }, [isShown]);

  if (!isShown) return null;

  const progress = ((currentStep + 1) / SIMULATION_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[--kw-border] bg-[--kw-surface] p-6 sm:p-8 shadow-2xl"
      >
        {/* Google RGB top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          {GOOGLE_COLORS.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: color }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4285f4] shadow-lg shadow-blue-500/25">
            <Zap className="h-7 w-7 text-white animate-pulse" />
          </div>

          <h3 className="font-heading font-swanky text-xl sm:text-2xl text-[--kw-heading] mb-1 tracking-wide">
            Executing Match Simulation
          </h3>
          <p className="text-xs text-[--kw-muted] font-mono mb-5">
            KICKWISE ML Inference Pipeline
          </p>

          {/* Step list */}
          <div className="w-full space-y-2 text-left mb-5 text-xs">
            {SIMULATION_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const color = GOOGLE_COLORS[idx % GOOGLE_COLORS.length];

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition-all font-sans ${
                    isCurrent
                      ? "bg-[--kw-surface-2] border border-[--kw-border]"
                      : isCompleted
                      ? "opacity-60"
                      : "opacity-30"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: GOOGLE_COLORS[idx % GOOGLE_COLORS.length] }}
                    />
                  ) : isCurrent ? (
                    <Loader2
                      className="h-4 w-4 animate-spin flex-shrink-0"
                      style={{ color }}
                    />
                  ) : (
                    <div
                      className="h-4 w-4 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: "var(--kw-border)" }}
                    />
                  )}
                  <span
                    className={isCurrent ? "font-semibold text-[--kw-text]" : "text-[--kw-subtext]"}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Google RGB progress bar */}
          <div className="w-full h-2 rounded-full bg-[--kw-surface-2] overflow-hidden border border-[--kw-border]">
            <motion.div
              className="h-full rounded-full animate-rgb-shimmer"
              initial={{ width: "10%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <span className="text-[10px] font-mono text-[--kw-muted] mt-2">
            {Math.round(progress)}% complete
          </span>
        </div>
      </motion.div>
    </div>
  );
}
