"use client";

import React from "react";
import { Timer, Radio, Play, RotateCcw, AlertTriangle, Activity } from "lucide-react";
import { InPlayState } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface LiveMatchControllerProps {
  inPlayState: InPlayState;
  onChange: (state: InPlayState) => void;
  homeTeam: string;
  awayTeam: string;
}

export function LiveMatchController({
  inPlayState,
  onChange,
  homeTeam,
  awayTeam,
}: LiveMatchControllerProps) {
  const timePresets = [
    { label: "15'", val: 15 },
    { label: "30'", val: 30 },
    { label: "45' (HT)", val: 45 },
    { label: "60'", val: 60 },
    { label: "75'", val: 75 },
    { label: "85'", val: 85 },
  ];

  return (
    <div className="w-full rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-[--kw-surface] to-indigo-500/5 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[--kw-border]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Radio className={cn("h-4 w-4", inPlayState.isLive && "animate-pulse text-red-500")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[--kw-text]">
                In-Game Live Match State
              </span>
              {inPlayState.isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-red-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  LIVE {inPlayState.elapsedMinutes === 45 ? "HT" : `${inPlayState.elapsedMinutes}'`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[--kw-subtext] font-sans">
              Simulate in-play tactical momentum with custom match clock and live scoreline.
            </p>
          </div>
        </div>

        {/* Toggle Live Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onChange({
                ...inPlayState,
                isLive: !inPlayState.isLive,
                elapsedMinutes: inPlayState.isLive ? 0 : (inPlayState.elapsedMinutes || 45),
              })
            }
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5",
              inPlayState.isLive
                ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                : "bg-[--kw-surface-2] text-[--kw-text] hover:bg-blue-500/10 hover:text-[#4285f4] border border-[--kw-border]"
            )}
          >
            {inPlayState.isLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                In-Play Active
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Enable In-Play Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Controls (Active when isLive is true) */}
      {inPlayState.isLive && (
        <div className="mt-4 pt-1 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Live Scoreboard Inputs */}
          <div className="sm:col-span-6 flex items-center justify-between rounded-xl bg-[--kw-surface-2] border border-[--kw-border] p-3">
            <div className="flex-1 text-center pr-2">
              <span className="text-[11px] font-mono text-[#4285f4] font-bold block truncate max-w-[120px] mx-auto">
                {homeTeam.split(" ")[0]}
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  onClick={() =>
                    onChange({
                      ...inPlayState,
                      currentHomeScore: Math.max(0, inPlayState.currentHomeScore - 1),
                    })
                  }
                  className="h-6 w-6 rounded-lg bg-[--kw-surface] border border-[--kw-border] text-xs font-bold text-[--kw-text] hover:bg-slate-100"
                >
                  -
                </button>
                <span className="font-mono text-2xl font-black text-[#4285f4]">
                  {inPlayState.currentHomeScore}
                </span>
                <button
                  onClick={() =>
                    onChange({
                      ...inPlayState,
                      currentHomeScore: inPlayState.currentHomeScore + 1,
                    })
                  }
                  className="h-6 w-6 rounded-lg bg-[--kw-surface] border border-[--kw-border] text-xs font-bold text-[--kw-text] hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="px-3 border-x border-[--kw-border] text-center">
              <span className="text-[10px] font-mono text-[--kw-muted] block uppercase">Live Score</span>
              <span className="font-mono text-xs font-black text-[--kw-muted]">:</span>
            </div>

            <div className="flex-1 text-center pl-2">
              <span className="text-[11px] font-mono text-[#34a853] font-bold block truncate max-w-[120px] mx-auto">
                {awayTeam.split(" ")[0]}
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  onClick={() =>
                    onChange({
                      ...inPlayState,
                      currentAwayScore: Math.max(0, inPlayState.currentAwayScore - 1),
                    })
                  }
                  className="h-6 w-6 rounded-lg bg-[--kw-surface] border border-[--kw-border] text-xs font-bold text-[--kw-text] hover:bg-slate-100"
                >
                  -
                </button>
                <span className="font-mono text-2xl font-black text-[#34a853]">
                  {inPlayState.currentAwayScore}
                </span>
                <button
                  onClick={() =>
                    onChange({
                      ...inPlayState,
                      currentAwayScore: inPlayState.currentAwayScore + 1,
                    })
                  }
                  className="h-6 w-6 rounded-lg bg-[--kw-surface] border border-[--kw-border] text-xs font-bold text-[--kw-text] hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Match Minute Selector */}
          <div className="sm:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[--kw-muted] flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                Match Clock:
              </span>
              <span className="font-mono text-xs font-bold text-[--kw-text]">
                {inPlayState.elapsedMinutes === 45
                  ? "45' (Half-Time)"
                  : `${inPlayState.elapsedMinutes}' (${90 - inPlayState.elapsedMinutes} mins left)`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {timePresets.map((t) => (
                <button
                  key={t.val}
                  onClick={() =>
                    onChange({
                      ...inPlayState,
                      elapsedMinutes: t.val,
                    })
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors border",
                    inPlayState.elapsedMinutes === t.val
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-[--kw-surface-2] text-[--kw-text] border-[--kw-border] hover:bg-slate-100"
                  )}
                >
                  {t.label}
                </button>
              ))}

              <button
                onClick={() =>
                  onChange({
                    isLive: false,
                    currentHomeScore: 0,
                    currentAwayScore: 0,
                    elapsedMinutes: 0,
                  })
                }
                title="Reset to 0-0 Pre-Match"
                className="p-1 rounded-lg text-xs text-[--kw-muted] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 ml-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
