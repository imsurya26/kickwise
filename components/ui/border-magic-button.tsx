"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BorderMagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function BorderMagicButton({
  children,
  className,
  innerClassName,
  ...props
}: BorderMagicButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1.5px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-transform active:scale-95 shadow-md hover:shadow-lg",
        className
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#4285f4_0%,#34a853_25%,#fbbc04_50%,#ea4335_75%,#4285f4_100%)]" />
      <span
        className={cn(
          "inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-6 py-2 text-sm font-semibold text-slate-800 dark:text-white backdrop-blur-3xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 gap-2",
          innerClassName
        )}
      >
        {children}
      </span>
    </button>
  );
}
