"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import {
  BrainCircuit,
  Settings2,
  Hexagon,
  Trophy,
  Database,
} from "lucide-react";

/* ─── Node Component ───────────────────────────────────────────── */
interface NodeProps {
  className?: string;
  children?: React.ReactNode;
  label: string;
  sublabel?: string;
  color?: string;
}

const ArchNode = forwardRef<HTMLDivElement, NodeProps>(
  ({ className, children, label, sublabel, color = "#22d3ee" }, ref) => {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          ref={ref}
          className={cn(
            "z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-zinc-900 shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]",
            className
          )}
          style={{ borderColor: `${color}55`, boxShadow: `0 0 18px ${color}25` }}
        >
          <div style={{ color }}>{children}</div>
        </div>
        <div className="text-center max-w-[100px]">
          <p
            className="text-[9px] font-mono font-semibold leading-tight tracking-wide"
            style={{ color }}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-[8px] font-mono text-zinc-600 leading-tight mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    );
  }
);
ArchNode.displayName = "ArchNode";

/* ─── Brand Logos as inline SVG / text ─────────────────────────── */
function KaggleLogo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
      <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.285.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.07.336z" />
    </svg>
  );
}

function NextjsLogo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.049-.106.005-4.703.007-4.705.073-.091a.637.637 0 0 1 .174-.143c.096-.047.134-.052.54-.052.479 0 .558.019.683.155.037.038 1.341 2.001 2.9 4.361a4483.13 4483.13 0 0 0 4.816 7.269l1.93 2.913.097-.063a12.317 12.317 0 0 0 2.465-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.499-.054z" />
    </svg>
  );
}

function FastapiLogo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
      <path d="M12 0C5.375 0 0 5.375 0 12c0 6.626 5.375 12 12 12 6.626 0 12-5.374 12-12 0-6.625-5.374-12-12-12zm-.624 21.62v-7.528H7.19L13.203 2.38v7.528h4.029L11.376 21.62z" />
    </svg>
  );
}

function SupabaseLogo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
      <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.015.985 1.259 1.408 1.873.636l9.262-11.652c1.093-1.375.113-3.403-1.645-3.403h-9.579L11.9 1.036z" />
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export function KickwiseArchitecture({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Left column refs
  const n1Ref = useRef<HTMLDivElement>(null); // Kaggle Data
  const n2Ref = useRef<HTMLDivElement>(null); // Feature Eng
  const n3Ref = useRef<HTMLDivElement>(null); // ML Ensemble
  const n4Ref = useRef<HTMLDivElement>(null); // Supabase

  // Right column refs
  const n5Ref = useRef<HTMLDivElement>(null); // Pitch UI
  const n6Ref = useRef<HTMLDivElement>(null); // FastAPI
  const n7Ref = useRef<HTMLDivElement>(null); // Visual Output
  const n8Ref = useRef<HTMLDivElement>(null); // Result Modal

  const LEFT_COLOR = "#94a3b8";
  const RIGHT_COLOR = "#22d3ee";
  const CROSS_COLOR = "#a78bfa";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10",
        className
      )}
    >
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
            KICKWISE ENGINE — System Architecture
          </span>
        </div>
      </div>

      {/* Column Labels */}
      <div className="absolute top-14 left-[18%] z-10">
        <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          ◀ Data &amp; ML Pipeline
        </span>
      </div>
      <div className="absolute top-14 right-[14%] z-10">
        <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
          Client UI &amp; Gateway ▶
        </span>
      </div>

      {/* Two-Column Node Grid */}
      <div className="relative z-10 mt-10 grid grid-cols-2 gap-x-24 sm:gap-x-36 gap-y-10 items-center">
        {/* ── Left Column ── */}
        <ArchNode
          ref={n1Ref}
          label="Kaggle / FBref Data"
          sublabel="Shots · Passes · xG · xA"
          color={LEFT_COLOR}
        >
          <KaggleLogo color={LEFT_COLOR} />
        </ArchNode>

        {/* ── Right Column ── */}
        <ArchNode
          ref={n5Ref}
          label="Interactive Pitch UI"
          sublabel="Drag 11v11 / Formations"
          color={RIGHT_COLOR}
        >
          <NextjsLogo color={RIGHT_COLOR} />
        </ArchNode>

        <ArchNode
          ref={n2Ref}
          label="Feature Engineering"
          sublabel="Per-90 · Position-Weight"
          color={LEFT_COLOR}
        >
          <Settings2 className="h-5 w-5" />
        </ArchNode>

        <ArchNode
          ref={n6Ref}
          label="Fast API Gateway"
          sublabel="POST /simulate · 50ms"
          color={RIGHT_COLOR}
        >
          <FastapiLogo color={RIGHT_COLOR} />
        </ArchNode>

        <ArchNode
          ref={n3Ref}
          label="ML Modeling Ensemble"
          sublabel="XGBoost · Poisson · SHAP"
          color={LEFT_COLOR}
        >
          <BrainCircuit className="h-5 w-5" />
        </ArchNode>

        <ArchNode
          ref={n7Ref}
          label="Visual Output Layers"
          sublabel="Radar · Prob. Matrix"
          color={RIGHT_COLOR}
        >
          <Hexagon className="h-5 w-5" />
        </ArchNode>

        <ArchNode
          ref={n4Ref}
          label="Supabase PostgreSQL"
          sublabel="Audit Log · History"
          color={LEFT_COLOR}
        >
          <SupabaseLogo color={LEFT_COLOR} />
        </ArchNode>

        <ArchNode
          ref={n8Ref}
          label="Result Pop-Up Modal"
          sublabel="Narrative · Score · Conf"
          color={RIGHT_COLOR}
        >
          <Trophy className="h-5 w-5" />
        </ArchNode>
      </div>

      {/* ── BEAMS ── */}

      {/* Left vertical: 1→2→3→4 */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n1Ref}
        toRef={n2Ref}
        gradientStartColor={LEFT_COLOR}
        gradientStopColor="#60a5fa"
        pathColor="#334155"
        pathWidth={2}
        duration={4}
        delay={0}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n2Ref}
        toRef={n3Ref}
        gradientStartColor={LEFT_COLOR}
        gradientStopColor="#60a5fa"
        pathColor="#334155"
        pathWidth={2}
        duration={4}
        delay={0.6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n3Ref}
        toRef={n4Ref}
        gradientStartColor={LEFT_COLOR}
        gradientStopColor="#60a5fa"
        pathColor="#334155"
        pathWidth={2}
        duration={4}
        delay={1.2}
      />

      {/* Right vertical: 5→6→7→8 */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n5Ref}
        toRef={n6Ref}
        gradientStartColor={RIGHT_COLOR}
        gradientStopColor="#818cf8"
        pathColor="#164e63"
        pathWidth={2}
        duration={4}
        delay={0.3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n6Ref}
        toRef={n7Ref}
        gradientStartColor={RIGHT_COLOR}
        gradientStopColor="#818cf8"
        pathColor="#164e63"
        pathWidth={2}
        duration={4}
        delay={0.9}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n7Ref}
        toRef={n8Ref}
        gradientStartColor={RIGHT_COLOR}
        gradientStopColor="#818cf8"
        pathColor="#164e63"
        pathWidth={2}
        duration={4}
        delay={1.5}
      />

      {/* Cross-column: Node2 → Node6 (Feature Eng → API Gateway) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n2Ref}
        toRef={n6Ref}
        gradientStartColor={CROSS_COLOR}
        gradientStopColor="#f472b6"
        pathColor="#3b2f6e"
        pathWidth={1.5}
        duration={5}
        delay={1.8}
        curvature={-60}
      />

      {/* Cross-column: Node3 → Node7 (ML Ensemble → Visual Output) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={n3Ref}
        toRef={n7Ref}
        gradientStartColor={CROSS_COLOR}
        gradientStopColor="#f472b6"
        pathColor="#3b2f6e"
        pathWidth={1.5}
        duration={5}
        delay={2.4}
        curvature={-60}
      />

      {/* Footer legend */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-5 z-20">
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6 bg-gradient-to-r from-[#94a3b8] to-[#60a5fa]" />
          <span className="text-[8px] font-mono text-zinc-600">ML Pipeline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6 bg-gradient-to-r from-[#22d3ee] to-[#818cf8]" />
          <span className="text-[8px] font-mono text-zinc-600">UI Gateway</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6 bg-gradient-to-r from-[#a78bfa] to-[#f472b6]" />
          <span className="text-[8px] font-mono text-zinc-600">Cross-Layer Signal</span>
        </div>
      </div>
    </div>
  );
}
