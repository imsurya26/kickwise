"use client";

import React from "react";
import {
  Home,
  Sliders,
  PieChart,
  Compass,
  Grid,
  BrainCircuit,
  BarChart3,
  Flame,
} from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";
import { TabType } from "@/components/sidebar";
import { cn } from "@/lib/utils";

interface BottomDockNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const DOCK_TABS: {
  id: TabType;
  label: string;
  tooltip: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  badge?: string;
}[] = [
  { id: "landing",   label: "Home",     tooltip: "Project Architecture & Summary",   icon: Home,        color: "text-blue-500",   activeColor: "#4285f4" },
  { id: "simulator", label: "Pitch",    tooltip: "Tactical Pitch Simulator",        icon: Sliders,     color: "text-blue-500",   activeColor: "#4285f4" },
  { id: "forecast",  label: "Forecast", tooltip: "Match Outcome Forecast",           icon: PieChart,    color: "text-red-500",    activeColor: "#ea4335" },
  { id: "radar",     label: "Radar",    tooltip: "6-Axis Tactical Radar",            icon: Compass,     color: "text-yellow-500", activeColor: "#fbbc04" },
  { id: "matrix",    label: "Matrix",   tooltip: "Scoreline Probability Matrix",     icon: Grid,        color: "text-green-500",  activeColor: "#34a853" },
  { id: "explain",   label: "SHAP",     tooltip: "ML Feature Attribution",          icon: BrainCircuit,color: "text-purple-500", activeColor: "#9334e6", badge: "ML" },
  { id: "model",     label: "Score",    tooltip: "Model Performance Score",          icon: BarChart3,   color: "text-blue-500",   activeColor: "#4285f4" },
  { id: "derbies",   label: "Derbies",  tooltip: "Preset Bundesliga Derbies",        icon: Flame,       color: "text-red-500",    activeColor: "#ea4335" },
];

export function BottomDockNav({ activeTab, onSelectTab }: BottomDockNavProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 max-w-full">
      <Dock iconSize={54} iconMagnification={74} iconDistance={120}>
        {DOCK_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <DockIcon
              key={tab.id}
              isActive={isActive}
              activeColor={tab.activeColor}
              tooltip={tab.tooltip}
              badge={tab.badge}
              onClick={() => onSelectTab(tab.id)}
            >
              <Icon
                className={cn("h-6 w-6 transition-all duration-200", isActive ? "scale-110" : tab.color)}
                style={isActive ? { color: tab.activeColor } : undefined}
              />
              <span
                className={cn(
                  "font-heading font-swanky text-[8px] tracking-wide leading-none mt-0.5",
                  isActive ? "font-bold" : "text-[--kw-muted]"
                )}
                style={isActive ? { color: tab.activeColor } : undefined}
              >
                {tab.label}
              </span>
            </DockIcon>
          );
        })}
      </Dock>
    </div>
  );
}
