"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PointerProps {
  children?: React.ReactNode;
  className?: string;
}

export function Pointer({ children, className }: PointerProps) {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
        setVisible(true);
      });
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 ${className ?? ""}`}
          style={{ left: pos.x, top: pos.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.3 }}
        >
          {children ?? <DefaultPointerIcon />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DefaultPointerIcon() {
  return (
    <motion.div
      animate={{ rotate: [0, 5, -5, 0], scale: [0.9, 1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="url(#kickPointerGrad)" opacity="0.9" />
        <circle cx="14" cy="14" r="5" fill="white" opacity="0.85" />
        <defs>
          <radialGradient id="kickPointerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4285f4" />
            <stop offset="50%" stopColor="#9334e6" />
            <stop offset="100%" stopColor="#ea4335" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
