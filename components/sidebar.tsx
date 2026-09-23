"use client";

import {
  Compass,
  Flame,
  Grid,
  Sliders,
  PieChart,
  BrainCircuit,
  BarChart3,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

export type TabType =
  | "landing"
  | "simulator"
  | "forecast"
  | "radar"
  | "matrix"
  | "explain"
  | "derbies"
  | "model";

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasResults: boolean;
  modelVersion?: string;
}

const NAV_ITEMS: {
  id: TabType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
  activeColor: string;
  activeBg: string;
}[] = [
  {
    id: "simulator",
    label: "Tactical Pitch",
    sublabel: "Formation & Starting XI",
    icon: Sliders,
    color: "text-blue-500",
    activeColor: "text-blue-600",
    activeBg: "bg-blue-50 border-blue-200",
  },
  {
    id: "forecast",
    label: "Match Forecast",
    sublabel: "Win Probabilities & xG",
    icon: PieChart,
    color: "text-red-500",
    activeColor: "text-red-600",
    activeBg: "bg-red-50 border-red-200",
  },
  {
    id: "radar",
    label: "Tactical Radar",
    sublabel: "6-Axis Squad Profile",
    icon: Compass,
    color: "text-yellow-500",
    activeColor: "text-yellow-600",
    activeBg: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "matrix",
    label: "Score Matrix",
    sublabel: "Scoreline Probability Grid",
    icon: Grid,
    color: "text-green-500",
    activeColor: "text-green-600",
    activeBg: "bg-green-50 border-green-200",
  },
  {
    id: "explain",
    label: "SHAP Explain",
    sublabel: "ML Feature Attribution",
    icon: BrainCircuit,
    badge: "ML",
    color: "text-purple-500",
    activeColor: "text-purple-600",
    activeBg: "bg-purple-50 border-purple-200",
  },
  {
    id: "model",
    label: "Model Score",
    sublabel: "Performance Metrics",
    icon: BarChart3,
    color: "text-blue-500",
    activeColor: "text-blue-600",
    activeBg: "bg-blue-50 border-blue-200",
  },
  {
    id: "derbies",
    label: "Preset Derbies",
    sublabel: "Classic Bundesliga Matchups",
    icon: Flame,
    color: "text-red-500",
    activeColor: "text-red-600",
    activeBg: "bg-red-50 border-red-200",
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  hasResults,
  modelVersion = "v1.2.0-prod",
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-60 xl:w-64 flex-shrink-0 flex flex-col justify-between rounded-2xl border border-[--kw-border] bg-[--kw-surface] p-4 shadow-[var(--kw-shadow-sm)] sticky top-6 h-fit">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-1 py-2 mb-5 border-b border-[--kw-border] pb-4">
          {/* Google RGB dot indicator */}
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ea4335]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbc04]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" />
          </div>

          <div>
            <span className="font-heading font-swanky text-xl tracking-wide text-google-rgb">
              KICKWISE
            </span>
            <p className="text-[9px] font-mono text-[--kw-muted] tracking-wider uppercase mt-0.5">
              Bundesliga ML Engine
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-1.5">
          <div className="px-2 py-1 font-mono text-[9px] font-semibold tracking-wider text-[--kw-muted] uppercase mb-1">
            Features
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "group relative w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150 text-left border",
                  isActive
                    ? `${item.activeBg} ${item.activeColor} shadow-sm`
                    : "border-transparent text-[--kw-subtext] hover:bg-[--kw-surface-2] hover:text-[--kw-text]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors flex-shrink-0",
                      isActive
                        ? `bg-[--kw-surface] dark:bg-[#1a1e2b] shadow-sm ${item.activeColor}`
                        : `bg-[--kw-surface-2] ${item.color} group-hover:bg-[--kw-surface]`
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="font-heading font-swanky text-[13.5px] leading-tight tracking-wide">
                      {item.label}
                    </div>
                    <div className="font-mono text-[9px] text-[--kw-muted] leading-tight mt-0.5">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                      item.badge === "ML"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model status footer */}
      <div className="mt-6 pt-4 border-t border-[--kw-border] space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] text-[--kw-muted]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34a853] animate-pulse" />
            ML Live
          </span>
          <span className="text-[9px]">{modelVersion}</span>
        </div>

        <div className="rounded-xl bg-[--kw-surface-2] p-2.5 border border-[--kw-border]">
          <div className="flex items-center justify-between font-mono text-[9px] text-[--kw-subtext]">
            <span>Model Calibration</span>
            <span className="text-[#34a853] font-semibold">94.8%</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-[--kw-border] overflow-hidden">
            <div className="h-full w-[94.8%] bg-[#34a853] rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  );
}
