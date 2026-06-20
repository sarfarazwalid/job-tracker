"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Briefcase,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  Zap,
  Shield,
  Brain,
  CheckCircle2,
  XCircle,
  MessageCircle,
  TrendingUp,
  Target,
  FolderKanban,
  CalendarDays,
  Building2,
  LineChart,
  Layers,
  Rocket,
  ArrowUpRight,
} from "lucide-react";
import {
  RevealOnScroll,
  StaggerContainer,
  StaggerItem,
} from "./components/motion-provider";
import { MagneticButton } from "./components/magnetic-button";
import { AIFeaturesModal } from "./components/ai-features-modal";
import { Logo } from "./components/logo";
import { Navbar } from "./components/navbar";

/* ────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
   ──────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const staggerParent = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ────────────────────────────────────────────────────────────
   LANDING PAGE
   ──────────────────────────────────────────────────────────── */
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAIFeaturesOpen, setIsAIFeaturesOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="landing min-h-screen overflow-x-hidden">
      {/* ══════════════ NAVIGATION ══════════════ */}
      <Navbar onAIFeaturesOpen={() => setIsAIFeaturesOpen(true)} />

      {/* ══════════════ SECTION 1: HERO ══════════════ */}
      <section className="landing-glass-section pt-28 sm:pt-36 pb-16 sm:pb-24">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="landing-mesh-blob w-[500px] h-[500px] bg-[#FF6B00]/[0.06] top-[-10%] right-[-5%]"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="landing-mesh-blob w-[400px] h-[400px] bg-[#FF6B00]/[0.08] bottom-[-15%] left-[-10%]"
            style={{ animationDelay: "7s" }}
          />
          <div
            className="landing-mesh-blob w-[300px] h-[300px] bg-[#FF6B00]/[0.06] top-[30%] left-[50%]"
            style={{ animationDelay: "14s" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start landing-hero-grid">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerParent}
            >
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--landing-accent-light)] border border-[var(--landing-accent)]/15 text-[var(--landing-accent)] text-xs font-semibold mb-6"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Job Search Intelligence
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-[var(--landing-text-primary)]"
              >
                Track Your Career Journey With{" "}
                <span className="landing-gradient-text">Intelligence</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-6 text-lg sm:text-xl text-[var(--landing-text-secondary)] max-w-xl leading-relaxed"
              >
                Manage applications, prepare for interviews, analyze your
                resume, and organize your entire job search from one powerful
                workspace.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <MagneticButton>
                  <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 h-12 px-7 bg-[#FF6B00] text-white text-sm font-bold rounded-full shadow-lg shadow-orange-500/20 hover:bg-[#E85D04] hover:shadow-orange-500/30 transition-all cursor-pointer"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </Link>
                </MagneticButton>
              <MagneticButton>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsAIFeaturesOpen(true)}
                  className="inline-flex items-center gap-2 h-12 px-7 bg-[#16191D] text-[var(--landing-text-primary)] text-sm font-bold rounded-full border border-[var(--landing-glass-border)] shadow-sm hover:border-[var(--landing-accent)]/30 hover:shadow-md transition-all cursor-pointer"
                >
                  Explore AI Features
                  <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                </motion.button>
              </MagneticButton>
              </motion.div>
            </motion.div>

            {/* Right: Animated product preview */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.3, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full min-h-[660px] h-auto overflow-visible flex flex-col justify-between py-8">
                  {/* Top row */}
                  <div className="flex justify-between items-start gap-6">
                    <div className="landing-float w-[400px] bg-[var(--landing-glass-bg)] rounded-2xl shadow-lg border border-[var(--landing-glass-border)] p-6 z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--landing-accent-light)] flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-[var(--landing-accent)]" />
                        </div>
                        <span className="text-base font-bold text-[var(--landing-text-primary)]">Career Command Center</span>
                      </div>
                      <p className="text-xs text-[var(--landing-text-secondary)] leading-relaxed mb-3 line-clamp-3">
                        Monitor your entire job search from one centralized workspace. Track applications, upcoming interviews, company interactions, and career progress in real time.
                      </p>
                      <p className="text-[11px] text-[var(--landing-text-muted)] italic">
                        Stay organized and never lose track of an opportunity.
                      </p>
                    </div>

                    <div className="landing-float-delayed w-[400px] bg-[var(--landing-glass-bg)] rounded-2xl shadow-lg border border-[var(--landing-glass-border)] p-6 z-20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="text-sm font-semibold text-green-400">Application Pipeline</span>
                      </div>
                      <p className="text-xs text-[var(--landing-text-secondary)] leading-relaxed mb-3 line-clamp-3">
                        Visualize every stage of your job search, from newly discovered opportunities to final offers.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Wishlist</span>
                        <span className="px-3 py-1 text-xs font-semibold bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">Applied</span>
                        <span className="px-3 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">Interview</span>
                        <span className="px-3 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">Offer</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex justify-between items-start gap-6 mt-16">
                    <div className="landing-float-slow w-[400px] bg-[var(--landing-glass-bg)] rounded-2xl shadow-lg border border-[var(--landing-glass-border)] p-5 z-10">
                      <div className="text-sm font-bold text-[var(--landing-text-primary)] mb-2">Career Analytics</div>
                      <p className="text-xs text-[var(--landing-text-secondary)] leading-relaxed mb-4 line-clamp-2">
                        Understand how your job search is performing with insights into application activity and interview conversion rates.
                      </p>
                      <div className="flex items-end gap-2.5 mb-2">
                        <span className="text-3xl font-bold text-[var(--landing-text-primary)] mono-number">67%</span>
                        <span className="text-sm font-semibold text-green-500 flex items-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4" /> +12%
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--landing-text-muted)] italic">
                        Turn data into better career decisions.
                      </p>
                    </div>

                    <div className="landing-float w-[400px] bg-gradient-to-br from-[#FF6B00] to-[#E85D04] rounded-2xl shadow-xl p-5 text-white z-30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-semibold opacity-90 leading-tight">AI Resume Match Score</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed mb-4 line-clamp-2">
                        Instantly compare your resume against job requirements and receive a compatibility score.
                      </p>
                      <div className="text-4xl font-extrabold mono-number">86%</div>
                      <div className="text-xs text-white/80 mt-1.5">Strong Match · Apply with confidence</div>
                    </div>
                  </div>
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ SECTION 2: PRODUCT PREVIEW ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              Your career command center
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              See everything that matters in one glance — applications,
              interviews, analytics, and AI insights.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative bg-[var(--landing-glass-bg)] rounded-3xl shadow-xl border border-[var(--landing-glass-border)] p-6 sm:p-8 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <div className="flex-1" />
              <div className="h-6 w-48 bg-[#0D0F12] rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pipeline columns */}
              {[
                {
                  title: "Applied",
                  color: "bg-blue-500",
                  count: 12,
                  cards: [
                    { role: "Frontend Engineer", company: "Stripe", tag: "Remote" },
                    { role: "Full Stack Developer", company: "Vercel", tag: "Hybrid" },
                  ],
                },
                {
                  title: "Interview",
                  color: "bg-[#FF6B00]",
                  count: 5,
                  cards: [
                    { role: "Sr. React Developer", company: "TechCorp", tag: "On-site" },
                    { role: "Software Engineer", company: "Linear", tag: "Remote" },
                  ],
                },
                {
                  title: "Offer",
                  color: "bg-green-500",
                  count: 2,
                  cards: [
                    { role: "Lead Developer", company: "Notion", tag: "Remote" },
                  ],
                },
              ].map((col) => (
                <div key={col.title} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <span className="text-sm font-bold text-[var(--landing-text-primary)]">{col.title}</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--landing-text-muted)] bg-[#0D0F12] px-2 py-0.5 rounded-full mono-number">
                      {col.count}
                    </span>
                  </div>
                  {col.cards.map((card) => (
                    <div
                      key={card.role}
                      className="bg-[#0D0F12] rounded-xl p-4 border border-[var(--landing-glass-border)] hover:border-[var(--landing-accent)]/20 hover:shadow-sm transition-all"
                    >
                      <div className="text-sm font-semibold text-[var(--landing-text-primary)] mb-1">{card.role}</div>
                      <div className="text-xs text-[var(--landing-text-secondary)] mb-4">{card.company}</div>
                      <span className="inline-block text-[12px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/70 text-[var(--landing-text-secondary)]">
                        {card.tag}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom analytics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--landing-glass-border)]">
              {[
                { label: "Total Applications", value: "7", icon: Briefcase },
                { label: "Response Rate", value: "34%", icon: TrendingUp },
                { label: "AI Resume Score", value: "86%", icon: Sparkles },
                { label: "Upcoming Interviews", value: "2", icon: CalendarDays },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0F12]">
                  <div className="w-9 h-9 rounded-lg bg-[var(--landing-accent-light)] flex items-center justify-center flex-shrink-0">
                    <stat.icon className="h-4 w-4 text-[var(--landing-accent)]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[var(--landing-text-primary)] mono-number">{stat.value}</div>
                    <div className="text-[10px] text-[var(--landing-text-muted)] font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ══════════════ SECTION 3: PROBLEM / SOLUTION ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-error)]/10 border border-[var(--status-error)]/20 text-[var(--status-error)] text-xs font-semibold mb-4"
            >
              The Problem
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              Job searching becomes chaos without a system
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              Without a unified workspace, candidates waste time and miss
              critical opportunities.
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: FolderKanban,
                title: "Lost Applications",
                description:
                  "Applications get buried across spreadsheets, browser tabs, and notes, making it difficult to track progress.",
                color: "text-red-500",
                bg: "bg-red-50",
              },
              {
                icon: Clock,
                title: "Missed Opportunities",
                description:
                  "Important interviews, follow-ups, and deadlines can easily be forgotten without a central system.",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                icon: Target,
                title: "Unclear Decisions",
                description:
                  "Without insights, users often apply randomly without knowing where they have the strongest chances.",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
            ].map((card) => (
              <StaggerItem key={card.title}>
                <div className="landing-glass p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4`}
                    style={{ backgroundColor: card.bg === 'bg-red-50' ? 'rgba(255,77,77,0.1)' : card.bg === 'bg-amber-50' ? 'rgba(255,176,32,0.1)' : 'rgba(34,211,238,0.1)' }}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--landing-text-primary)] mb-2">{card.title}</h3>
                  <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed">{card.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Solution bridge */}
          <div className="text-center mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--status-success)]/10 border border-[var(--status-success)]/20 text-[var(--status-success)] text-xs font-semibold mb-4"
            >
              The Solution
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              One workspace for your entire job search
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              Organize applications, monitor progress, analyze opportunities,
              and make better decisions from one centralized platform.
            </p>
          </div>

          <StaggerContainer className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm font-medium text-[var(--landing-text-primary)]">
            {["Applications", "Tracking", "Analytics", "AI Insights"].map(
              (step, i) => (
                <StaggerItem key={step}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-[var(--landing-accent)] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-orange-200">
                        {i + 1}
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-[#0D0F12] border border-[var(--landing-glass-border)] shadow-sm font-semibold">
                        {step}
                      </span>
                    </div>
                    {i < 3 && (
                      <ArrowRight className="h-4 w-4 text-[var(--landing-text-muted)] hidden sm:block" />
                    )}
                  </div>
                </StaggerItem>
              )
            )}
          </StaggerContainer>
        </RevealOnScroll>
      </section>

      {/* ══════════════ SECTION 4: FEATURE SHOWCASE ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              Everything you need to land your next role
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              Powerful features designed to streamline your entire job search
              workflow.
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Smart Dashboard",
                tagline: "Your job search overview in one place.",
                description:
                  "Monitor applications, interviews, offers, and progress through a personalized dashboard built to keep your career goals organized.",
                cta: "View Dashboard",
                href: "/dashboard",
              },
              {
                icon: Briefcase,
                title: "Application Tracker",
                tagline: "Never lose track of an opportunity.",
                description:
                  "Manage applications from submission to final decision with detailed information, notes, company details, and status tracking.",
                cta: "Manage Applications",
                href: "/applications",
              },
              {
                icon: Layers,
                title: "Kanban Workflow",
                tagline: "Visualize your career pipeline.",
                description:
                  "Move opportunities through each stage and understand exactly where every application stands.",
                cta: "Open Kanban",
                href: "/kanban",
              },
              {
                icon: CalendarDays,
                title: "Interview Calendar",
                tagline: "Stay prepared for every event.",
                description:
                  "Schedule interviews, assessments, and deadlines while keeping your career schedule organized.",
                cta: "View Calendar",
                href: "/calendar",
              },
              {
                icon: Building2,
                title: "Company Tracking",
                tagline: "Build your company history.",
                description:
                  "Store company details, recruiter notes, and application records to maintain complete context.",
                cta: "Explore Companies",
                href: "/companies",
              },
              {
                icon: LineChart,
                title: "Career Analytics",
                tagline: "Turn activity into insights.",
                description:
                  "Understand your application trends, success rates, and progress with meaningful career analytics.",
                cta: "View Analytics",
                href: "/analytics",
              },
            ].map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="landing-glass landing-feature-card group relative h-full p-6 flex flex-col">
                  <div className="relative z-[1] flex flex-col h-full">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--landing-accent-light)] mb-4">
                      <feature.icon className="h-6 w-6 text-[var(--landing-accent)]" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--landing-text-primary)] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-semibold text-[var(--landing-accent)] mb-2">
                      {feature.tagline}
                    </p>
                    <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed mb-4 flex-1">
                      {feature.description}
                    </p>
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--landing-accent)] group-hover:gap-2.5 transition-all"
                    >
                      {feature.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealOnScroll>
      </section>

      {/* ══════════════ SECTION 5: AI SECTION ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--landing-accent-light)] border border-[var(--landing-accent)]/15 text-[var(--landing-accent)] text-xs font-semibold mb-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Powered by AI
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              AI That Helps You Apply Smarter
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              Let artificial intelligence optimize your job search and surface
              insights you'd otherwise miss.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Resume Analyzer */}
            <div className="landing-glass p-0 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--landing-accent)] to-[var(--landing-accent-hover)] flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--landing-text-primary)]">
                      AI Resume Analyzer
                    </h3>
                    <p className="text-xs text-[var(--landing-text-secondary)]">
                      Compare your resume with job requirements
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed mb-6">
                  Compare your resume with job requirements and receive a
                  compatibility score before applying. Know your strengths and
                  gaps instantly.
                </p>

                {/* Score visual */}
                <div className="bg-[#0D0F12] rounded-2xl p-5 border border-[var(--landing-glass-border)]">
                  <div className="flex items-center gap-6">
                    {/* Score ring */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full landing-score-ring">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#FF6B00"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="264"
                          strokeDashoffset={264 * (1 - 0.86)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-extrabold text-[#FF6B00] mono-number">
                          86%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--landing-text-muted)] uppercase tracking-wider mb-1.5">
                          Matching Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["React", "Node.js", "MongoDB"].map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--landing-text-muted)] uppercase tracking-wider mb-1.5">
                          Missing Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["Docker", "AWS"].map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 text-xs font-semibold rounded-full border border-red-100"
                            >
                              <XCircle className="h-3 w-3" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 h-10 px-5 bg-[#FF6B00] text-white text-sm font-semibold rounded-full shadow-md hover:bg-[#E85D04] transition-colors cursor-pointer"
                    >
                      Try Resume Analyzer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>

            {/* AI Career Assistant */}
            <div className="landing-glass p-0 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#E85D04] flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--landing-text-primary)]">
                      AI Career Assistant
                    </h3>
                    <p className="text-xs text-[var(--landing-text-secondary)]">
                      Your personal career advisor
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed mb-6">
                  Get instant help with resume questions, career advice, and job
                  search decisions. Available from every page when you need it.
                </p>

                {/* Chat preview */}
                <div className="bg-[#0D0F12] rounded-2xl p-5 border border-[var(--landing-glass-border)] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D04] flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-[#16191D] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-[var(--landing-glass-border)]">
                      <p className="text-sm text-[var(--landing-text-primary)]">
                        Hi! How can I help with your job search today?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[var(--landing-text-secondary)]">You</span>
                    </div>
                    <div className="bg-[var(--landing-accent)] px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
                      <p className="text-sm text-white">
                        Can you review my resume for a React position?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E85D04] flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-[#16191D] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-[var(--landing-glass-border)]">
                      <p className="text-sm text-[var(--landing-text-primary)]">
                        Of course! Paste your resume and the job description, and
                        I'll analyze the match...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-[var(--landing-text-muted)] flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Always available via the floating chat button
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ══════════════ SECTION 6: WORKFLOW ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              How JobTracker Works
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              From first application to final offer, four simple steps to
              organize your career journey.
            </p>
          </div>

          <div className="relative">
            {/* Timeline connector line (hidden on mobile) */}
            <div className="landing-timeline-line hidden lg:block" />

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  icon: Rocket,
                  title: "Save Opportunities",
                  description: "Track every job you discover from any source.",
                },
                {
                  step: "02",
                  icon: FolderKanban,
                  title: "Manage Progress",
                  description:
                    "Move applications through your hiring pipeline.",
                },
                {
                  step: "03",
                  icon: Brain,
                  title: "Use AI Insights",
                  description: "Understand where you match best with AI.",
                },
                {
                  step: "04",
                  icon: TrendingUp,
                  title: "Improve Results",
                  description: "Make smarter career decisions with data.",
                },
              ].map((item) => (
                <StaggerItem key={item.step}>
                  <div className="relative text-center">
                    {/* Step circle */}
                    <div className="relative z-10 mx-auto w-14 h-14 rounded-full bg-[#16191D] border-2 border-[var(--landing-accent)]/30 flex items-center justify-center shadow-md shadow-orange-100/20 mb-5">
                      <item.icon className="h-6 w-6 text-[var(--landing-accent)]" />
                    </div>
                    <div className="text-xs font-bold text-[var(--landing-accent)]/40 mb-2 mono-number">
                      STEP {item.step}
                    </div>
                    <h3 className="text-base font-bold text-[var(--landing-text-primary)] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed max-w-[200px] mx-auto">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </RevealOnScroll>
      </section>

      {/* ══════════════ SECTION 7: BENEFITS ══════════════ */}
      <section className="landing-glass-section">
        <RevealOnScroll className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--landing-text-primary)] tracking-tight">
              Built for serious job seekers
            </h2>
            <p className="mt-4 text-[var(--landing-text-secondary)] max-w-2xl mx-auto text-lg">
              Every feature is designed to save you time and improve your
              outcomes.
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: "Stay Organized",
                description:
                  "Keep every application and interview in one place.",
                gradient: "from-blue-50 to-indigo-50",
                iconColor: "text-blue-500",
              },
              {
                icon: Target,
                title: "Apply Smarter",
                description:
                  "Know your compatibility before applying to any role.",
                gradient: "from-orange-50 to-amber-50",
                iconColor: "text-[#FF6B00]",
              },
              {
                icon: Zap,
                title: "Save Time",
                description:
                  "Reduce manual tracking and scattered information.",
                gradient: "from-green-50 to-emerald-50",
                iconColor: "text-green-500",
              },
              {
                icon: TrendingUp,
                title: "Grow Faster",
                description: "Improve your strategy using actionable insights.",
                gradient: "from-purple-50 to-violet-50",
                iconColor: "text-purple-500",
              },
            ].map((benefit) => (
              <StaggerItem key={benefit.title}>
                <div className="landing-glass text-center p-6 h-full">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.gradient} mb-4`}
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${benefit.gradient === 'from-blue-50 to-indigo-50' ? '#1E293B,#312E81' : benefit.gradient === 'from-orange-50 to-amber-50' ? '#7C2D12,#78350F' : benefit.gradient === 'from-green-50 to-emerald-50' ? '#064E3B,#065F46' : '#4C1D95,#5B21B6'})` }}
                  >
                    <benefit.icon className={`h-7 w-7 ${benefit.iconColor}`} />
                  </div>
                  <h4 className="text-base font-bold text-[var(--landing-text-primary)] mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-[var(--landing-text-secondary)] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </RevealOnScroll>
      </section>


      {/* ══════════════ SECTION 9: FOOTER ══════════════ */}
      <footer className="bg-gradient-to-r from-[#E85D04] via-[#FF6B00] to-[#E85D04] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/ai-analyze" className="hover:text-white transition-colors">
                    AI Features
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className="hover:text-white transition-colors">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-center">
            <p className="text-sm text-white/70 font-medium">
              &copy; {new Date().getFullYear()} JobTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Features Modal */}
      <AIFeaturesModal
        isOpen={isAIFeaturesOpen}
        onClose={() => setIsAIFeaturesOpen(false)}
      />
    </div>
  );
}