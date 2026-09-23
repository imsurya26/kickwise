"use client";

import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Text3DFlip } from "./text-3d-flip";

export interface HeroProduct {
  title: string;
  link: string;
  thumbnail: string;
  category?: string;
  badge?: string;
  description?: string;
  onClick?: () => void;
}

export const HeroParallax = ({
  products,
  onLaunch,
  headerContent,
}: {
  products: HeroProduct[];
  onLaunch?: () => void;
  headerContent?: React.ReactNode;
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 600]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -600]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.3, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-500, 200]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="min-h-[280vh] py-16 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header onLaunch={onLaunch} headerContent={headerContent} />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-12 mb-12">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row space-x-12 mb-12">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-12 mb-12">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = ({
  onLaunch,
  headerContent,
}: {
  onLaunch?: () => void;
  headerContent?: React.ReactNode;
}) => {
  if (headerContent) {
    return <>{headerContent}</>;
  }

  return (
    <div className="max-w-7xl relative mx-auto py-12 md:py-20 px-4 w-full left-0 top-0 z-20">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-mono font-semibold text-[#4285f4] mb-4">
        <span className="h-2 w-2 rounded-full bg-[#4285f4] animate-pulse" />
        BUNDESLIGA MATCH INTELLIGENCE & TACTICAL WHAT-IF SIMULATOR
      </div>

      <h1 className="text-3xl md:text-6xl font-bold font-swanky text-[--kw-text] leading-tight max-w-4xl">
        <Text3DFlip
          className="inline-block"
          textClassName="text-[--kw-text]"
          flipTextClassName="text-[#4285f4]"
          rotateDirection="top"
          staggerDuration={0.02}
        >
          KICKWISE
        </Text3DFlip>{" "}
        <br />
        <span className="text-xl md:text-4xl bg-gradient-to-r from-[#4285f4] via-[#ea4335] to-[#34a853] bg-clip-text text-transparent font-extrabold">
          Tactical Telemetry & Outcome AI Engine
        </span>
      </h1>

      <p className="max-w-2xl text-base md:text-lg mt-4 text-[--kw-subtext] font-sans leading-relaxed">
        XGBoost Multiclass Probability Engine · Bivariate Poisson 6×6 Scoreline Modeling · SHAP TreeExplainer Feature Attribution · Real-Time Interactive Formation Physics.
      </p>

      {onLaunch && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={onLaunch}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4285f4] to-[#34a853] px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <span className="font-mono text-sm tracking-wide">ENTER LIVE SIMULATOR →</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: HeroProduct;
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -12,
      }}
      key={product.title}
      className="group/product h-[22rem] sm:h-[26rem] w-[28rem] sm:w-[36rem] md:w-[42rem] relative flex-shrink-0 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl transition-all duration-300 hover:shadow-blue-500/20 hover:border-blue-400"
      onClick={product.onClick}
    >
      <div className="block group-hover/product:shadow-2xl h-full w-full relative cursor-pointer">
        <img
          src={product.thumbnail}
          height="800"
          width="1200"
          className="object-cover object-left-top absolute h-full w-full inset-0 transition-transform duration-500 group-hover/product:scale-[1.03]"
          alt={product.title}
        />
        <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none transition-opacity duration-300" />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {product.category && (
            <span className="rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 px-3.5 py-1 text-[11px] font-mono text-white shadow-sm">
              {product.category}
            </span>
          )}
          {product.badge && (
            <span className="rounded-full bg-blue-600/90 backdrop-blur-md border border-blue-400/30 px-3.5 py-1 text-[11px] font-mono font-bold text-white shadow-md">
              {product.badge}
            </span>
          )}
        </div>

        {/* Bottom Title & Description */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/90 border-t border-slate-100 dark:border-zinc-800">
          <h2 className="text-base sm:text-lg font-bold font-swanky text-slate-900 dark:text-white group-hover/product:text-blue-600 dark:group-hover/product:text-cyan-400 transition-colors">
            {product.title}
          </h2>
          {product.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
