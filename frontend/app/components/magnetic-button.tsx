"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Max pixels the button can shift from center (default 8) */
  maxShift?: number;
}

/**
 * Wraps a button in a detection zone that subtly pulls it toward the cursor
 * as it approaches. Uses spring physics for an organic feel.
 *
 * Applied only to specific primary CTAs — not every button in the app.
 * Disabled on touch devices and under prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  className,
  maxShift = 8,
}: MagneticButtonProps) {
  const zoneRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    // Disable on touch devices and reduced-motion
    const isTouch = window.matchMedia("(hover: none)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || prefersReduced) return;

    const handleMove = (e: MouseEvent) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Normalize to maxShift — buttons within 150px detection radius
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.max(rect.width, rect.height) / 2 + 40;

      if (dist < radius) {
        const factor = Math.min(1, (radius - dist) / radius) * (maxShift / (radius || 1));
        x.set(dx * factor);
        y.set(dy * factor);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleLeave = () => {
      x.set(0);
      y.set(0);
    };

    zone.addEventListener("mousemove", handleMove);
    zone.addEventListener("mouseleave", handleLeave);

    return () => {
      zone.removeEventListener("mousemove", handleMove);
      zone.removeEventListener("mouseleave", handleLeave);
    };
  }, [maxShift, x, y]);

  return (
    <div ref={zoneRef} className={className} style={{ position: "relative", display: "inline-block" }}>
      <motion.div
        style={{ x: springX, y: springY, position: "relative" }}
      >
        {children}
      </motion.div>
    </div>
  );
}