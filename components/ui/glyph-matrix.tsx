"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlyphMatrixProps {
  rows?: number;
  cols?: number;
  className?: string;
  speed?: number;
}

const GLYPHS = "0123456789ABCDEF∆∇∑∏∫≈≠≤≥⊕⊗λμσπθ01";

export function GlyphMatrix({
  rows = 8,
  cols = 32,
  className,
  speed = 80,
}: GlyphMatrixProps) {
  const [grid, setGrid] = useState<string[][]>([]);

  useEffect(() => {
    // Initialize random glyphs
    const initialGrid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () =>
        GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
      )
    );
    setGrid(initialGrid);

    const interval = setInterval(() => {
      setGrid((prev) =>
        prev.map((row) =>
          row.map((glyph) =>
            Math.random() > 0.85
              ? GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
              : glyph
          )
        )
      );
    }, speed);

    return () => clearInterval(interval);
  }, [rows, cols, speed]);

  return (
    <div
      className={cn(
        "font-mono text-[10px] leading-3 tracking-widest text-cyan-500/40 select-none overflow-hidden",
        className
      )}
    >
      {grid.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-between whitespace-pre">
          {row.map((char, cIdx) => (
            <span
              key={cIdx}
              className={
                Math.random() > 0.94
                  ? "text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                  : Math.random() > 0.85
                  ? "text-emerald-400/80"
                  : ""
              }
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
