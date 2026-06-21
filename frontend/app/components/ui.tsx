"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { GlassCard, AmberButton, StatusTag, AnimatedDropdown } from "./primitives";

/* ──────── Button (re-export) ──────── */
export { AmberButton as Button };

/* ──────── Input ──────── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] backdrop-blur-sm",
              "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
              "transition-all duration-[var(--transition-fast)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-10",
              suffix && "pr-9",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ──────── Textarea ──────── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none backdrop-blur-sm",
            "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
            "transition-all duration-[var(--transition-fast)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ──────── Select (custom dropdown — no native blue highlight) ──────── */
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ className, label, options, value, onChange, required, disabled, id }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isPlaceholder = !value || !options.find((o) => o.value === value);
    // Filter out empty placeholder option so it never appears as a highlighted selection in the dropdown
    const selectableOptions = options.filter((o) => o.value !== "");

    return (
      <div className={cn("space-y-1.5", disabled && "opacity-50 pointer-events-none")} ref={ref}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[var(--text-secondary)]">
            {label}
            {required && <span className="text-[var(--status-error)] ml-0.5">*</span>}
          </label>
        )}
        <AnimatedDropdown
          options={selectableOptions}
          value={value}
          onChange={onChange || (() => {})}
          placeholder={isPlaceholder ? options[0]?.label || "Select..." : undefined}
          className={className}
          triggerLabel={label}
        />
      </div>
    );
  }
);
Select.displayName = "Select";

/* ──────── Card → GlassCard compatibility ──────── */
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, hover = false, glow = false, padding = "md" }: CardProps) {
  return (
    <GlassCard padding={padding} className={cn(glow && "hover:shadow-[var(--shadow-glow)]", className)}>
      {children}
    </GlassCard>
  );
}

/* ──────── Badge (re-export from primitives as StatusTag) ──────── */
export { StatusTag as Badge };

/* ──────── Skeleton ──────── */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white/[0.04] rounded-[var(--radius-md)] animate-pulse",
        className
      )}
    />
  );
}

/* ──────── Avatar ──────── */
interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "from-[var(--accent-primary)] to-amber-600",
    "from-emerald-600 to-emerald-500",
    "from-cyan-600 to-cyan-500",
    "from-purple-600 to-purple-500",
    "from-rose-600 to-rose-500",
    "from-blue-600 to-blue-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-br",
        avatarSizes[size],
        getAvatarColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

/* ──────── Empty State ──────── */
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-4 text-[var(--text-muted)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm text-center">{description}</p>
      {action}
    </div>
  );
}

/* ──────── Section Header ──────── */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ──────── Divider ──────── */
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-white/[0.08]", className)} />;
}

/* ──────── ModalOverlay ──────── */
interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
}

export function ModalOverlay({ children, onClose }: ModalOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#16191D]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}