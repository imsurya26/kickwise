"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCircularProgressBarProps {
  max?: number;
  value: number;
  min?: number;
  gaugePrimaryColor: string;
  gaugeSecondaryColor?: string;
  className?: string;
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor = "#e8ebf8",
  className,
  label,
  sublabel,
  size = 140,
  strokeWidth = 10,
}: AnimatedCircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={gaugeSecondaryColor}
          fill="none"
        />

        {/* Dynamic Glowing Value Stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={gaugePrimaryColor}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Centered Value / Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-mono text-xl md:text-2xl font-bold tracking-tighter"
          style={{ color: gaugePrimaryColor }}
        >
          {Math.round(percentage)}%
        </span>
        {label && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-[--kw-muted]">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[9px] text-[--kw-muted] font-mono">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
