"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { cn } from "../lib/utils";
import { Check, ChevronDown } from "lucide-react";

/* ─────────────── GlassCard ─────────────── */
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const cardPaddings = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({ children, className, hover = true, padding = "md" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        cardPaddings[padding],
        hover && "hover:shadow-panel-hover",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────── AmberButton (primary action) ─────────────── */
type AmberButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

const amberButtonVariants = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:shadow-[var(--shadow-glow)]",
  secondary:
    "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.15)] hover:bg-[var(--bg-card-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent",
};

const amberButtonSizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
};

export const AmberButton = ({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  type = "button",
  onClick,
}: AmberButtonProps) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)] focus-ring cursor-pointer select-none",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        amberButtonVariants[variant],
        amberButtonSizes[size],
        className
      )}
      disabled={disabled || loading}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
};

/* ─────────────── AnimatedDropdown ─────────────── */
interface DropdownOption {
  value: string;
  label: string;
}

interface AnimatedDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerLabel?: string;
}

export function AnimatedDropdown({ options, value, onChange, placeholder = "Select", className, triggerLabel }: AnimatedDropdownProps) {
  const [open, setOpen] = useState(false);
  const coordsRef = useRef({ top: 0, left: 0, width: 180 });
  const maxHRef = useRef(288);
  const ref = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const toggleOpen = useCallback(() => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const computedMax = Math.min(288, Math.max(120, window.innerHeight - 32 - rect.bottom));
      coordsRef.current = {
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(ref.current.offsetWidth, 180),
      };
      maxHRef.current = computedMax;
    }
    setOpen((v) => !v);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close only if click is outside both the trigger and the portal panel
      const outsideTrigger = ref.current && !ref.current.contains(target);
      const outsidePortal = portalRef.current && !portalRef.current.contains(target);
      if (outsideTrigger && outsidePortal) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block text-left", className)}>
      <motion.button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "inline-flex items-center justify-between gap-2 h-9 pl-3 pr-2 rounded-[var(--radius-md)] border border-[rgba(255,255,255,0.08)] bg-[var(--bg-card)] backdrop-blur-md text-sm text-[var(--text-primary)] shadow-sm transition-colors",
          "hover:bg-[var(--bg-card-hover)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className={cn("truncate", !selected && "text-[var(--text-muted)]")}>
          {triggerLabel ? `${triggerLabel}: ` : ""}
          {selected ? selected.label : placeholder}
        </span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </span>
      </motion.button>

      {open &&
        createPortal(
          <motion.div
            ref={portalRef}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed z-[9999] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#16191D]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{
              top: coordsRef.current.top,
              left: coordsRef.current.left,
              width: coordsRef.current.width,
              maxHeight: maxHRef.current,
            }}
          >
            <div className="max-h-[240px] overflow-y-auto overscroll-contain custom-scrollbar">
              <div className="py-1">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.preventDefault();
                        onChange(opt.value);
                        requestAnimationFrame(() => setOpen(false));
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors duration-150",
                        isSelected
                          ? "bg-[var(--accent-glow-strong)] text-[var(--accent-primary)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent-primary)]"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>,
          document.body
        )
      }
    </div>
  );
}

/* ─────────────── TiltCard ─────────────── */
interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 14 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateX.set(-py * 8);
      rotateY.set(px * 8);
    };
    const handleLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("will-change-transform", className)}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────── AIResponseCard ─────────────── */
interface AIResponseCardProps {
  children: ReactNode;
  className?: string;
  loading?: boolean;
  score?: number;
}

export function AIResponseCard({ children, className, loading, score }: AIResponseCardProps) {
  const displayScore = useMotionValue(0);
  const springScore = useSpring(displayScore, { stiffness: 120, damping: 14 });

  useEffect(() => {
    if (typeof score === "number") {
      const start = performance.now();
      const duration = 900;
      const from = 0;
      const to = score;
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        displayScore.set(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [score, displayScore]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(255,255,255,0.08)] bg-[rgba(22,25,29,0.8)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        {/* Animated amber→green gradient border */}
        <div className="absolute inset-0 rounded-[var(--radius-xl)] p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-gradient-to-r from-[var(--accent-primary)] via-[var(--status-success)] to-[var(--accent-primary)] opacity-20 animate-pulse" style={{ animationDuration: "4s" }} />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-4">
            <span className="inline-flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-sm text-[var(--text-muted)]">Analyzing...</span>
          </div>
        ) : (
          <div className="p-5 relative z-[1]">
            {typeof score === "number" && (
              <div className="text-4xl font-bold text-[var(--accent-primary)] tracking-tight mb-3 mono-number">
                {Math.round(springScore.get())}
              </div>
            )}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
                hidden: {},
              }}
              className="space-y-3"
            >
              {typeof children === "string" ? (
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-[var(--text-secondary)] leading-relaxed"
                >
                  {children}
                </motion.p>
              ) : (
                children
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────── StatusTag (replaces OrangeBadge) ─────────────── */
interface StatusTagProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "info" | "orange" | "purple" | "warning" | "success" | "error" | "applied";
  dot?: boolean;
}

const statusColorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  default: { bg: "bg-white/[0.05]", text: "text-[var(--text-secondary)]", border: "border-white/[0.08]", dot: "bg-[var(--text-muted)]" },
  info: { bg: "bg-cyan-400/10", text: "text-cyan-400", border: "border-cyan-400/20", dot: "bg-cyan-400" },
  purple: { bg: "bg-[var(--accent-primary)]/10", text: "text-[var(--accent-primary)]", border: "border-[var(--accent-primary)]/20", dot: "bg-[var(--accent-primary)]" },
  warning: { bg: "bg-[var(--accent-primary)]/10", text: "text-[var(--accent-primary)]", border: "border-[var(--accent-primary)]/20", dot: "bg-[var(--accent-primary)]" },
  success: { bg: "bg-[var(--status-success)]/10", text: "text-[var(--status-success)]", border: "border-[var(--status-success)]/20", dot: "bg-[var(--status-success)]" },
  error: { bg: "bg-[var(--status-error)]/10", text: "text-[var(--status-error)]", border: "border-[var(--status-error)]/20", dot: "bg-[var(--status-error)]" },
  applied: { bg: "bg-cyan-400/10", text: "text-cyan-400", border: "border-cyan-400/20", dot: "bg-cyan-400" },
};

export function StatusTag({ children, className, variant = "default", dot = false }: StatusTagProps) {
  const colors = statusColorMap[variant] || statusColorMap.default;
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", colors.dot)} />}
      {children}
    </motion.span>
  );
}