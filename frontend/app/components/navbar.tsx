"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  Briefcase,
  LayoutDashboard,
  KanbanSquare,
  Building2,
  CalendarDays,
  Bell,
  BarChart3,
  TrendingUp,
  Brain,
  MessageCircle,
  ArrowRight,
  ChevronDown,
  Layers,
  Zap,
  Target,
  Rocket,
  FileText,
  Star,
  Users,
  ChevronRight,
  X,
} from "lucide-react";
import { Logo } from "./logo";

/* ──────────────────────────────────────────────────────────────
   NAVIGATION DATA
   ────────────────────────────────────────────────────────────── */

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}

interface DropdownSection {
  title?: string;
  items: FeatureItem[];
}

const pricingFeatures = [
  { label: "Application Tracking", included: true },
  { label: "Kanban Board", included: true },
  { label: "Company Management", included: true },
  { label: "Interview Calendar", included: true },
  { label: "Notifications", included: true },
  { label: "Analytics", included: true },
  { label: "AI Resume Analyzer", included: true },
  { label: "AI Chatbot", included: true },
] as const;

const pricingComingSoon = [
  "Premium AI Insights",
  "Resume Version Management",
  "Advanced Analytics",
  "Team Features",
] as const;

const jobManagementItems: FeatureItem[] = [
  {
    icon: Briefcase,
    title: "Application Tracking",
    description: "Track all job opportunities.",
  },
  {
    icon: KanbanSquare,
    title: "Kanban Workflow",
    description: "Manage hiring stages visually.",
  },
  {
    icon: Building2,
    title: "Company Management",
    description: "Store recruiter and company information.",
  },
];

const productivityItems: FeatureItem[] = [
  {
    icon: CalendarDays,
    title: "Interview Calendar",
    description: "Manage interviews and preparation.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Stay updated with important events.",
  },
];

const insightsItems: FeatureItem[] = [
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Understand job search performance.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor improvement.",
  },
];

const howItWorksSteps = [
  {
    step: 1,
    icon: Rocket,
    title: "Save Opportunities",
    description: "Track every job you discover from any source.",
  },
  {
    step: 2,
    icon: LayoutDashboard,
    title: "Manage Applications",
    description: "Move applications through your hiring pipeline.",
  },
  {
    step: 3,
    icon: Brain,
    title: "Analyze Resume With AI",
    description: "Compare your resume with job requirements.",
  },
  {
    step: 4,
    icon: CalendarDays,
    title: "Schedule Interviews",
    description: "Prepare and manage your interview calendar.",
  },
  {
    step: 5,
    icon: TrendingUp,
    title: "Track Career Progress",
    description: "Make smarter career decisions with data.",
  },
];

/* ──────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
   ────────────────────────────────────────────────────────────── */

const easeOut: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeInOut" as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      mass: 0.6,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.12, ease: "easeInOut" as const },
  },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOut },
  },
};

/* ──────────────────────────────────────────────────────────────
   DROPDOWN COMPONENTS
   ────────────────────────────────────────────────────────────── */

function PricingDropdown({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[380px] z-50"
    >
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#16191D] border-l border-t border-[rgba(255,255,255,0.08)]" />

        {/* Card */}
        <div className="bg-[#16191D]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Current Plan */}
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
              Current Plan
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#F5F5F0]">
                  Free Forever
                </div>
                <div className="text-xs text-[#6B7280] mt-0.5">
                  No credit card required!
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/25 text-[#FF6B00] text-[10px] font-bold uppercase tracking-wider">
                Active
              </div>
            </div>
          </div>

          {/* Included Features */}
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
              Included Features
            </div>
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-x-3 gap-y-2"
            >
              {pricingFeatures.map((feat) => (
                <motion.div
                  key={feat.label}
                  variants={fadeSlide}
                  className="flex items-center gap-2 text-xs text-[#D1D5DB]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00D67E] shrink-0" />
                  {feat.label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Coming Soon */}
          <div className="p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
              Coming Soon
            </div>
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {pricingComingSoon.map((item) => (
                <motion.div
                  key={item}
                  variants={fadeSlide}
                  className="flex items-center gap-2 text-xs text-[#6B7280]"
                >
                  <Sparkles className="h-3 w-3 text-[#FF6B00]/50 shrink-0" />
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturesDropdown({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[560px] z-50"
    >
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#16191D] border-l border-t border-[rgba(255,255,255,0.08)]" />

        {/* Card */}
        <div className="bg-[#16191D]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden p-5">
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-5"
          >
            {/* Job Management */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                Job Management
              </div>
              <div className="space-y-3">
                {jobManagementItems.map((item) => (
                  <motion.div
                    key={item.title}
                    variants={fadeSlide}
                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
                    onClick={onItemClick}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF6B00]/15 transition-colors">
                      <item.icon className="h-4 w-4 text-[#FF6B00]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Productivity */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                  Productivity
                </div>
                <div className="space-y-3">
                  {productivityItems.map((item) => (
                    <motion.div
                      key={item.title}
                      variants={fadeSlide}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
                      onClick={onItemClick}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF6B00]/15 transition-colors">
                        <item.icon className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                  Insights
                </div>
                <div className="space-y-3">
                  {insightsItems.map((item) => (
                    <motion.div
                      key={item.title}
                      variants={fadeSlide}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer"
                      onClick={onItemClick}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF6B00]/15 transition-colors">
                        <item.icon className="h-4 w-4 text-[#FF6B00]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function AIFeaturesDropdown({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[500px] z-50"
    >
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#16191D] border-l border-t border-[rgba(255,255,255,0.08)]" />

        {/* Card */}
        <div className="bg-[#16191D]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#FF6B00]" />
            AI-Powered Features
          </div>

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* AI Resume Analyzer */}
            <motion.div
              variants={fadeSlide}
              className="group p-4 rounded-xl bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.12)] hover:bg-[rgba(255,107,0,0.1)] hover:border-[rgba(255,107,0,0.2)] transition-all cursor-pointer"
              onClick={onItemClick}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E85D04] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors flex items-center gap-2">
                    AI Resume Analyzer
                    <span className="px-1.5 py-0.5 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] text-[9px] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                    Compare resume and job requirements and receive a
                    compatibility score.
                  </div>

                  {/* Score preview */}
                  <div className="flex items-center gap-3 mt-3 p-2.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.04)]">
                    <div className="flex items-center gap-1.5">
                      <div className="text-lg font-extrabold text-[#FF6B00] font-mono leading-none">
                        86%
                      </div>
                      <div className="text-[10px] text-[#9CA3AF]">Match</div>
                    </div>
                    <div className="w-px h-5 bg-[rgba(255,255,255,0.08)]" />
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded-full bg-[#00D67E]/10 border border-[#00D67E]/20 text-[#00D67E] text-[9px] font-semibold">
                        Matching Skills
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 text-[#FF4D4D] text-[9px] font-semibold">
                        Missing Skills
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Career Assistant */}
            <motion.div
              variants={fadeSlide}
              className="group p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer"
              onClick={onItemClick}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E85D04] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors flex items-center gap-2">
                    AI Career Assistant
                    <span className="px-1.5 py-0.5 rounded-full bg-[#00D67E]/15 border border-[#00D67E]/25 text-[#00D67E] text-[9px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                    Floating AI chatbot available throughout the platform.
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {["Career Guidance", "Interview Prep", "Job Search"].map(
                      (cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded-full bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.15)] text-[#FF6B00] text-[9px] font-semibold"
                        >
                          {cap}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorksDropdown({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-[460px] z-50"
    >
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#16191D] border-l border-t border-[rgba(255,255,255,0.08)]" />

        {/* Card */}
        <div className="bg-[#16191D]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4">
            How JobTracker Works
          </div>

          <motion.div
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            {/* Vertical timeline line */}
            <div className="absolute left-[35px] top-5 bottom-4 w-px bg-gradient-to-b from-[#FF6B00] via-[#FF6B00]/50 to-[#FF6B00]/10" />

            <div className="space-y-1">
              {howItWorksSteps.map((step) => (
                <motion.div
                  key={step.step}
                  variants={fadeSlide}
                  className="group flex items-start gap-4 p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer relative"
                  onClick={onItemClick}
                >
                  {/* Step number */}
                  <div className="relative z-10 w-9 h-9 rounded-full bg-[#16191D] border-2 border-[#FF6B00]/40 flex items-center justify-center shrink-0 group-hover:border-[#FF6B00] transition-colors">
                    <span className="text-xs font-bold text-[#FF6B00] font-mono">
                      {step.step}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-sm font-semibold text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors">
                      {step.title}
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#6B7280] group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────
   NAVIGATION LINK STYLES
   ────────────────────────────────────────────────────────────── */

const linkBaseClass =
  "relative px-3 py-1.5 text-sm font-medium text-[#9CA3AF] hover:text-[#FF6B00] transition-colors duration-200 cursor-pointer";

const linkActiveClass = "text-[#FF6B00]";

const linkHoverGlow =
  "hover:drop-shadow-[0_0_8px_rgba(255,107,0,0.35)]";

const chevronBaseClass =
  "h-3 w-3 transition-all duration-200";

/* ──────────────────────────────────────────────────────────────
   MAIN NAVBAR
   ────────────────────────────────────────────────────────────── */

interface NavbarProps {
  onAIFeaturesOpen?: () => void;
}

export function Navbar({ onAIFeaturesOpen }: NavbarProps) {
  const [isAuthenticated] = useState(false); // Landing page always shows Sign In
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdown(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDropdownToggle = useCallback((name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  }, []);

  const handleHomeClick = useCallback(() => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setActiveDropdown(null);
  }, []);

  const handleLinkClick = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const ctaHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <nav
      ref={navbarRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        navScrolled
          ? "landing-nav-scrolled-premium"
          : "landing-nav-premium"
      }`}
    >
      {/* Bottom border glow when scrolled */}
      {navScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent" />
      )}

      <div className="max-w-[1440px] mx-auto px-6 2xl:px-8 h-16 flex items-center justify-between">
        {/* ── Left: Logo ── */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="relative">
            <Logo size="md" showText={false} />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F5F5F0] group-hover:text-[#FF6B00] transition-colors duration-300">
            JobTracker
          </span>
        </Link>

        {/* ── Center: Navigation Links ── */}
        <div className="flex items-center justify-center flex-1 select-none pl-8 xl:pl-16 2xl:pl-24">
          <div className="flex items-center gap-6">
            {/* Home - direct link */}
            <Link
              href="/"
              onClick={handleHomeClick}
              className={`${linkBaseClass} ${linkHoverGlow} rounded-lg`}
            >
              Home
            </Link>

            {/* Pricing - click toggles dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle("pricing")}
                className={`${linkBaseClass} ${linkHoverGlow} rounded-lg inline-flex items-center gap-1 ${
                  activeDropdown === "pricing" ? linkActiveClass : ""
                }`}
              >
                Pricing
                <ChevronDown
                  className={`${chevronBaseClass} ${
                    activeDropdown === "pricing" ? "rotate-180 text-[#FF6B00]" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeDropdown === "pricing" && (
                  <PricingDropdown onItemClick={handleLinkClick} />
                )}
              </AnimatePresence>
            </div>

            {/* Features - click toggles dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle("features")}
                className={`${linkBaseClass} ${linkHoverGlow} rounded-lg inline-flex items-center gap-1 ${
                  activeDropdown === "features" ? linkActiveClass : ""
                }`}
              >
                Features
                <ChevronDown
                  className={`${chevronBaseClass} ${
                    activeDropdown === "features" ? "rotate-180 text-[#FF6B00]" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeDropdown === "features" && (
                  <FeaturesDropdown onItemClick={handleLinkClick} />
                )}
              </AnimatePresence>
            </div>

            {/* AI Features - click toggles dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle("ai-features")}
                className={`${linkBaseClass} ${linkHoverGlow} rounded-lg inline-flex items-center gap-1 ${
                  activeDropdown === "ai-features" ? linkActiveClass : ""
                }`}
              >
                AI Features
                <ChevronDown
                  className={`${chevronBaseClass} ${
                    activeDropdown === "ai-features" ? "rotate-180 text-[#FF6B00]" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeDropdown === "ai-features" && (
                  <AIFeaturesDropdown onItemClick={handleLinkClick} />
                )}
              </AnimatePresence>
            </div>

            {/* How It Works - click toggles dropdown */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle("how-it-works")}
                className={`${linkBaseClass} ${linkHoverGlow} rounded-lg inline-flex items-center gap-1 ${
                  activeDropdown === "how-it-works" ? linkActiveClass : ""
                }`}
              >
                How It Works
                <ChevronDown
                  className={`${chevronBaseClass} ${
                    activeDropdown === "how-it-works" ? "rotate-180 text-[#FF6B00]" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeDropdown === "how-it-works" && (
                  <HowItWorksDropdown onItemClick={handleLinkClick} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right: Sign In ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href={ctaHref}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden group inline-flex items-center gap-2 h-9 px-5 bg-[#FF6B00] text-white text-sm font-semibold rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300"
            >
              {/* Button shine effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                {isAuthenticated ? "Dashboard" : "Sign In"}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          </Link>
        </div>
      </div>
    </nav>
  );
}