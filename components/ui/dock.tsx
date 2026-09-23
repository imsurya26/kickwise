"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 46;
const DEFAULT_MAGNIFICATION = 62;
const DEFAULT_DISTANCE = 130;

export function Dock({
  className,
  iconSize = DEFAULT_SIZE,
  iconMagnification = DEFAULT_MAGNIFICATION,
  iconDistance = DEFAULT_DISTANCE,
  direction = "bottom",
  children,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          mouseX,
          size: iconSize,
          magnification: iconMagnification,
          distance: iconDistance,
        } as any);
      }
      return child;
    });
  };

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "supports-backdrop-blur:bg-[--kw-surface]/75 mx-auto flex h-[76px] items-center justify-center gap-3 rounded-3xl border border-[--kw-border] bg-[--kw-surface]/90 backdrop-blur-xl shadow-google-lg transition-all",
        className
      )}
    >
      {renderChildren()}
    </motion.div>
  );
}

export interface DockIconProps {
  size?: number;
  magnification?: number;
  distance?: number;
  mouseX?: MotionValue<number>;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  tooltip?: string;
  badge?: string;
  activeColor?: string;
}

export function DockIcon({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  onClick,
  isActive = false,
  tooltip,
  badge,
  activeColor = "#4285f4",
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);

  const defaultMouseX = useMotionValue(Infinity);
  const effectiveMouseX = mouseX || defaultMouseX;

  const distanceCalc = useTransform(effectiveMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size]
  );

  const width = useSpring(widthSync, {
    mass: 0.08,
    stiffness: 200,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "group relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl transition-all select-none",
        isActive
          ? "bg-[--kw-surface] dark:bg-[#1e2336] shadow-md border border-[--kw-border]"
          : "bg-[--kw-surface-2]/80 hover:bg-[--kw-surface] dark:hover:bg-[#181c2a] border border-transparent hover:border-[--kw-border]",
        className
      )}
    >
      {/* Tooltip on hover */}
      {tooltip && (
        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg bg-[#1a1d2e] px-2.5 py-1 text-[11px] font-heading font-swanky text-white opacity-0 shadow-md transition-all duration-150 group-hover:opacity-100 group-hover:-top-10 whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1d2e]" />
        </div>
      )}

      {/* Icon Content */}
      <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none">
        {children}
      </div>

      {/* Active Indicator Pill */}
      {isActive && (
        <motion.div
          layoutId="activeDockDot"
          className="absolute -bottom-1 h-1.5 w-5 rounded-full"
          style={{ background: activeColor }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        />
      )}

      {/* Badge if present */}
      {badge && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-1 font-mono text-[8px] font-bold text-white shadow-sm">
          {badge}
        </span>
      )}
    </motion.div>
  );
}
