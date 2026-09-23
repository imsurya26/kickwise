"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Text3DFlip from "@/components/ui/text-3d-flip";

interface TopHeaderProps {
  homeTeam: string;
  awayTeam: string;
}

export function TopHeader({ homeTeam, awayTeam }: TopHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full flex items-center justify-between py-4 px-6 mb-6 rounded-2xl border border-[--kw-border] bg-[--kw-surface]/90 backdrop-blur-xl shadow-google-md relative overflow-hidden"
    >
      {/* Google RGB accent bar on top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex rounded-t-2xl overflow-hidden">
        {["#4285f4", "#ea4335", "#fbbc04", "#34a853"].map((c, i) => (
          <motion.div
            key={i}
            className="flex-1"
            style={{ background: c }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* Brand */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex gap-1.5">
          {["#4285f4", "#ea4335", "#fbbc04", "#34a853"].map((c, i) => (
            <motion.span
              key={i}
              className="h-3 w-3 rounded-full"
              style={{ background: c }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 400 }}
            />
          ))}
        </div>
        <div className="flex flex-col">
          <Text3DFlip
            rotateDirection="top"
            staggerDuration={0.03}
            className="font-heading font-swanky text-2xl sm:text-3xl tracking-wider text-google-rgb select-none leading-tight"
            textClassName="text-google-rgb"
          >
            KICKWISE
          </Text3DFlip>
          <span className="text-[10px] font-mono text-[--kw-muted] uppercase tracking-[0.2em] mt-0.5">
            Bundesliga Match Intelligence
          </span>
        </div>
      </div>

      {/* Right: Matchup pill + ML status + Theme Toggler */}
      <div className="flex items-center gap-4 mt-1">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[--kw-border] bg-[--kw-surface-2] px-4 py-2 font-mono text-[12px] shadow-sm">
          <span className="text-[#4285f4] font-bold">{homeTeam}</span>
          <span className="text-[--kw-muted] text-xs">vs</span>
          <span className="text-[#34a853] font-bold">{awayTeam}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1.5 font-mono text-[11px] text-green-600 dark:text-green-400">
          <motion.span
            className="h-2 w-2 rounded-full bg-[#34a853]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>ML Live</span>
        </div>

        {/* Animated Light / Dark Theme Switcher */}
        <AnimatedThemeToggler />
      </div>
    </motion.header>
  );
}
