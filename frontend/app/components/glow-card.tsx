"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { cn } from "../lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Status color to tint the glow — only for kanban cards */
  glowColor?: string;
}

/**
 * Wraps a card element with a cursor-tracking radial glow.
 * Uses direct CSS custom-property mutation on mousemove (not React state)
 * so zero re-renders are triggered during tracking.
 *
 * The glow appears as a `radial-gradient` at the cursor position, visible
 * only on hover. Kanban cards can pass a `glowColor` to tint it by status.
 */
export function GlowCard({ children, className, glowColor }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Disable on touch devices — no cursor to track
    if (window.matchMedia("(hover: none)").matches) return;

    let rafId: number | null = null;

    const handleMove = (e: MouseEvent) => {
      if (rafId) return; // throttle to rAF
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--gx", String(x));
        el.style.setProperty("--gy", String(y));
      });
    };

    const handleEnter = () => el.classList.add("glow-visible");
    const handleLeave = () => el.classList.remove("glow-visible");

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative glow-base",
        glowColor && "glow-colored",
        className
      )}
      style={
        {
          "--gx": "50%",
          "--gy": "50%",
          "--glow-color": glowColor || "rgba(255, 176, 32, 0.18)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}