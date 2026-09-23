"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Floating3DParticlesProps {
  className?: string;
  color?: string;
  particleCount?: number;
  speed?: number;
  depth?: number;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  vx: number;
  vy: number;
  vz: number;
  alpha: number;
  color: string;
}

export function Floating3DParticles({
  className,
  color = "#4285f4",
  particleCount = 55,
  speed = 0.5,
  depth = 600,
}: Floating3DParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const colors = [
      color,
      "#4285f4", // Google Blue
      "#34a853", // Google Green
      "#fbbc04", // Google Yellow
      "#ea4335", // Google Red
      "#9334e6", // Purple
    ];

    const particles: Particle3D[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * depth,
        radius: Math.random() * 3 + 1.5,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed - 0.2, // buoyant upward drift
        vz: (Math.random() - 0.5) * speed * 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[i % colors.length],
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      angle += 0.002 * speed;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Sort by depth for correct z-rendering
      particles.sort((a, b) => b.z - a.z);

      for (const p of particles) {
        // Continuous rotation in 3D space
        const rotX = p.x * cosA - p.z * sinA;
        const rotZ = p.z * cosA + p.x * sinA + depth / 2;

        p.y += p.vy;
        p.x += p.vx;
        p.z += p.vz;

        // Wrap around boundaries
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;
        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.z < 0) p.z = depth;
        if (p.z > depth) p.z = 0;

        if (rotZ <= 10) continue;

        // 3D perspective projection
        const scale = fov / (fov + rotZ);
        const projX = cx + rotX * scale;
        const projY = cy + p.y * scale;
        const projRadius = Math.max(0.5, p.radius * scale);

        if (projX < -50 || projX > width + 50 || projY < -50 || projY > height + 50) {
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0.1, p.alpha * scale * 1.2));
        ctx.beginPath();
        ctx.arc(projX, projY, projRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = projRadius * 4;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, particleCount, speed, depth]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none z-0", className)}
    />
  );
}
