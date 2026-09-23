"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className="w-full relative overflow-x-hidden bg-[#f8faff] dark:bg-zinc-950 transition-colors">
      {/* Bright Subtle Gradient Mesh Background for Light Theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Colorful Aurora Ambient Glows */}
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-300/20 to-transparent blur-[80px] pointer-events-none" />
        <div className="absolute top-60 -right-20 h-[450px] w-[450px] rounded-full bg-gradient-to-bl from-emerald-400/20 via-teal-300/15 to-transparent blur-[70px] pointer-events-none" />
        <div className="absolute top-[1200px] left-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-300/20 via-rose-300/15 to-transparent blur-[80px] pointer-events-none" />
        
        {/* Subtle Pitch / Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div
        className={cn(
          "relative flex flex-col min-h-screen items-center justify-center text-slate-900 dark:text-white",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </main>
  );
};
