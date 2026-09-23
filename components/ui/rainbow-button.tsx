"use client";

import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function RainbowButton({
  children,
  className,
  loading = false,
  disabled,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] font-sans text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
        className
      )}
      {...props}
    >
      {/* Animated Google RGB gradient ring */}
      <span
        className="absolute inset-0 h-full w-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(270deg, #4285f4, #ea4335, #fbbc04, #34a853, #4285f4)",
          backgroundSize: "300% 300%",
          animation: "rgbShimmer 4s ease infinite",
        }}
      />

      {/* Button interior */}
      <span className="relative flex h-full w-full items-center justify-center gap-2 rounded-full bg-[--kw-surface] dark:bg-[#12141d] px-6 py-2.5 text-[--kw-text] transition-colors duration-300 group-hover:bg-[--kw-surface-2] dark:group-hover:bg-[#1a1e2b] font-semibold">
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-[#4285f4]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-[--kw-muted]">Processing…</span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
