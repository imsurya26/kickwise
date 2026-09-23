"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── BentoGrid Container ──────────────────────────────────────── */
interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── BentoCard — supports Magic UI API (Icon, name, description, href, cta, background, className) ── */
interface BentoCardProps {
  Icon?: React.ElementType;
  name?: string;
  description?: string;
  href?: string;
  cta?: string;
  className?: string;
  background?: ReactNode;
  // Legacy props
  children?: ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  title?: string;
  glow?: boolean;
  colSpan?: 1 | 2 | 3;
}

export function BentoCard({
  Icon,
  name,
  description,
  href = "#",
  cta,
  className,
  background,
  children,
  header,
  icon,
  title,
  glow = false,
  colSpan = 1,
}: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[--kw-border] bg-[--kw-surface] p-5 shadow-sm transition-all duration-300 hover:shadow-google-md hover:border-[--kw-accent]/30",
        glow && "hover:shadow-blue-glow",
        className
      )}
    >
      {/* Background decoration area */}
      {background && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {background}
        </div>
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full gap-3">
        {header && <div>{header}</div>}

        {/* Icon + name row */}
        {(Icon || icon || name || title) && (
          <div className="flex items-center gap-2 mt-auto pt-4">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--kw-surface-2] border border-[--kw-border]">
                <Icon className="h-4 w-4 text-[--kw-accent]" />
              </div>
            )}
            {icon && (
              <div className="text-[--kw-accent]">{icon}</div>
            )}
            <div>
              {(name || title) && (
                <p className="text-sm font-semibold font-heading text-[--kw-text] leading-tight">
                  {name ?? title}
                </p>
              )}
              {description && (
                <p className="text-xs text-[--kw-muted] font-sans leading-snug mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {children && (
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        )}

        {cta && (
          <a
            href={href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[--kw-accent] hover:underline"
          >
            {cta}
            <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Subtle hover shimmer */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-[--kw-accent]/3 to-transparent" />
    </motion.div>
  );
}
