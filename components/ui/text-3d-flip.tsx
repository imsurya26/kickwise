"use client";

import React, { useState } from "react";
import { motion, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface Text3DFlipProps {
  children?: React.ReactNode;
  text?: string;
  flipText?: string;
  className?: string;
  textClassName?: string;
  flipTextClassName?: string;
  rotateDirection?: "top" | "bottom" | "left" | "right";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random";
  transition?: Transition;
  style?: React.CSSProperties;
}

export function Text3DFlip({
  children,
  text,
  flipText,
  className,
  textClassName,
  flipTextClassName,
  rotateDirection = "top",
  staggerDuration = 0.03,
  staggerFrom = "first",
  transition = { type: "spring", damping: 25, stiffness: 160 },
  style,
}: Text3DFlipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (typeof children === "string" ? children : text) || "";
  const targetFlip = flipText || content;
  const words = content.split(" ");
  const flipWords = targetFlip.split(" ");

  const getRotateValue = (dir: string, hovered: boolean) => {
    switch (dir) {
      case "top":
        return { initial: 0, target: hovered ? -90 : 0, flipInitial: 90, flipTarget: hovered ? 0 : 90 };
      case "bottom":
        return { initial: 0, target: hovered ? 90 : 0, flipInitial: -90, flipTarget: hovered ? 0 : -90 };
      case "left":
        return { initial: 0, target: hovered ? -90 : 0, flipInitial: 90, flipTarget: hovered ? 0 : 90 };
      case "right":
        return { initial: 0, target: hovered ? 90 : 0, flipInitial: -90, flipTarget: hovered ? 0 : -90 };
      default:
        return { initial: 0, target: hovered ? -90 : 0, flipInitial: 90, flipTarget: hovered ? 0 : 90 };
    }
  };

  const rot = getRotateValue(rotateDirection, isHovered);
  const isAxisY = rotateDirection === "left" || rotateDirection === "right";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("inline-flex flex-wrap items-center gap-x-1.5 cursor-pointer select-none", className)}
      style={{ perspective: 1000, ...style }}
    >
      {words.map((word, wordIdx) => {
        const letters = word.split("");
        const flipLetters = (flipWords[wordIdx] || word).split("");

        return (
          <span key={wordIdx} className="inline-flex items-center">
            {letters.map((char, charIdx) => {
              const flipChar = flipLetters[charIdx] || char;
              const delay =
                staggerFrom === "last"
                  ? (letters.length - 1 - charIdx) * staggerDuration
                  : charIdx * staggerDuration;

              return (
                <span
                  key={charIdx}
                  className="relative inline-block overflow-hidden py-0.5"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Primary face */}
                  <motion.span
                    animate={
                      isAxisY
                        ? { rotateY: rot.target, opacity: isHovered ? 0 : 1 }
                        : { rotateX: rot.target, opacity: isHovered ? 0 : 1 }
                    }
                    transition={{ ...transition, delay }}
                    className={cn("inline-block transform-gpu", textClassName)}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>

                  {/* Flipped face */}
                  <motion.span
                    initial={
                      isAxisY
                        ? { rotateY: rot.flipInitial, opacity: 0 }
                        : { rotateX: rot.flipInitial, opacity: 0 }
                    }
                    animate={
                      isAxisY
                        ? { rotateY: rot.flipTarget, opacity: isHovered ? 1 : 0 }
                        : { rotateX: rot.flipTarget, opacity: isHovered ? 1 : 0 }
                    }
                    transition={{ ...transition, delay }}
                    className={cn("absolute inset-0 inline-block transform-gpu", flipTextClassName || textClassName)}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {flipChar === " " ? "\u00A0" : flipChar}
                  </motion.span>
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

export default Text3DFlip;
