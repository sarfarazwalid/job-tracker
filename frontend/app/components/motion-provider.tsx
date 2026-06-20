"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  once?: boolean;
}

export function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}: RevealProps) {
  const [isClient, setIsClient] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const directionMap = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionMap[direction];

  // Prevent hydration mismatch: render static div on server, animated on client
  if (!isClient || shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
  once = true,
}: StaggerContainerProps) {
  const [isClient, setIsClient] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function StaggerItem({
  children,
  className = "",
  direction = "up",
}: StaggerItemProps) {
  const [isClient, setIsClient] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const directionMap = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionMap[direction];

  if (!isClient || shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    let start = 0;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      if (ref.current) ref.current.textContent = start.toString();
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>0</span>;
}