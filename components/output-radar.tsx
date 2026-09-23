"use client";

import { useMemo } from "react";
import { Compass } from "lucide-react";
import { RadarData } from "@/lib/validation";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

interface OutputRadarProps {
  radar: RadarData;
  homeTeam: string;
  awayTeam: string;
}

export function OutputRadar({ radar, homeTeam, awayTeam }: OutputRadarProps) {
  const axes = useMemo(
    () => [
      { key: "attack", label: "ATTACK", homeVal: radar?.home?.attack || 50, awayVal: radar?.away?.attack || 50 },
      { key: "creation", label: "CREATION", homeVal: radar?.home?.creation || 50, awayVal: radar?.away?.creation || 50 },
      { key: "midfield_control", label: "MIDFIELD", homeVal: radar?.home?.midfield_control || 50, awayVal: radar?.away?.midfield_control || 50 },
      { key: "pressing", label: "PRESSING", homeVal: radar?.home?.pressing || 50, awayVal: radar?.away?.pressing || 50 },
      { key: "defensive_stability", label: "DEFENCE", homeVal: radar?.home?.defensive_stability || 50, awayVal: radar?.away?.defensive_stability || 50 },
      { key: "transition", label: "TRANSITION", homeVal: radar?.home?.transition || 50, awayVal: radar?.away?.transition || 50 },
    ],
    [radar]
  );

  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;
  const totalAxes = axes.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const homePolygon = axes.map((a, i) => {
    const { x, y } = getCoordinates(a.homeVal, i);
    return `${x},${y}`;
  }).join(" ");

  const awayPolygon = axes.map((a, i) => {
    const { x, y } = getCoordinates(a.awayVal, i);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="google-card p-5 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[--kw-border]">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#fbbc04]" />
          <DiaTextReveal
            text="Tactical Radar Profile"
            className="text-sm font-bold"
            gradientClassName="from-[#fbbc04] via-[#ea4335] to-[#4285f4]"
            delay={0.04}
          />
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
            <span className="text-[#4285f4] font-semibold truncate max-w-[70px]">
              {homeTeam}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" />
            <span className="text-[#34a853] font-semibold truncate max-w-[70px]">
              {awayTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Radar SVG */}
      <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center my-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map((scale) => {
            const pts = axes.map((_, i) => {
              const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
              const r = radius * scale;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(" ");
            return (
              <polygon
                key={scale}
                points={pts}
                fill={scale <= 0.75 ? "rgba(66,133,244,0.02)" : "none"}
                stroke="rgba(66,133,244,0.12)"
                strokeWidth="1"
                strokeDasharray={scale < 1 ? "3,3" : "none"}
              />
            );
          })}

          {/* Axis spokes */}
          {axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
            return (
              <line
                key={i}
                x1={center} y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="rgba(66,133,244,0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Away polygon */}
          <polygon
            points={awayPolygon}
            fill="rgba(52,168,83,0.15)"
            stroke="#34a853"
            strokeWidth="2"
            className="transition-all duration-700 ease-out"
          />

          {/* Home polygon */}
          <polygon
            points={homePolygon}
            fill="rgba(66,133,244,0.18)"
            stroke="#4285f4"
            strokeWidth="2"
            className="transition-all duration-700 ease-out"
          />

          {/* Node dots */}
          {axes.map((axis, i) => {
            const h = getCoordinates(axis.homeVal, i);
            const a = getCoordinates(axis.awayVal, i);
            return (
              <g key={i}>
                <circle cx={h.x} cy={h.y} r="3.5" fill="#4285f4" />
                <circle cx={a.x} cy={a.y} r="3.5" fill="#34a853" />
              </g>
            );
          })}
        </svg>

        {/* Axis labels */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center font-mono text-[9px] font-bold">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[#ea4335]">ATTACK</span>
          <span className="absolute top-1/4 right-0 text-right text-[#fbbc04]">CREATION</span>
          <span className="absolute bottom-1/4 right-0 text-right text-[#34a853]">MIDFIELD</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[#4285f4]">PRESSING</span>
          <span className="absolute bottom-1/4 left-0 text-left text-[#9334e6]">DEFENCE</span>
          <span className="absolute top-1/4 left-0 text-left text-[#f59e0b]">TRANSITION</span>
        </div>
      </div>

      {/* Axis comparison mini table */}
      <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[--kw-border] font-mono text-[10px]">
        {axes.map((axis) => (
          <div
            key={axis.key}
            className="flex items-center justify-between rounded-lg bg-[--kw-surface-2] px-2.5 py-1.5 border border-[--kw-border-dim]"
          >
            <span className="text-[--kw-muted] text-[9px] truncate">{axis.label}</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[#4285f4]">{Math.round(axis.homeVal)}</span>
              <span className="text-[--kw-border]">:</span>
              <span className="text-[#34a853]">{Math.round(axis.awayVal)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
