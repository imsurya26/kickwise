"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DiaTextRevealProps {
  text: string;
  className?: string;
  gradientClassName?: string;
  delay?: number;
}

export function DiaTextReveal({
  text,
  className,
  gradientClassName = "from-cyan-400 via-sky-300 to-emerald-400",
  delay = 0,
}: DiaTextRevealProps) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(6px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans", className)}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          className={cn(
            "inline-block bg-gradient-to-r bg-clip-text text-transparent font-extrabold tracking-tight",
            gradientClassName
          )}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
