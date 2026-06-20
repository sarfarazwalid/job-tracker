"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowRight,
  FileText,
  MapPin,
  Percent,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, CountUp, RevealOnScroll } from "../components/motion-provider";
import { Card, Badge, EmptyState } from "../components/ui";
import { StatsCardSkeleton, DashboardSkeleton } from "../components/skeletons";
import { cn } from "../lib/utils";

/* ─────────────── Types ─────────────── */

interface JobApplication {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  appliedDate: string | null;
  location: string;
  salaryRange: string;
  createdAt: string;
  updatedAt: string;
}

interface Interview {
  _id: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string;
  interviewType: string;
  location: string;
  status: string;
}

interface StatsByStatus {
  [key: string]: number;
}

/* ─────────────── Status Config ─────────────── */

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "info" | "purple" | "warning" | "success" | "error" }> = {
  Wishlist: { label: "Wishlist", variant: "default" },
  Preparing: { label: "Preparing", variant: "info" },
  Applied: { label: "Applied", variant: "info" },
  Assessment: { label: "Assessment", variant: "warning" },
  Interview_Scheduled: { label: "Interview Scheduled", variant: "purple" },
  Interview_Completed: { label: "Interview Done", variant: "purple" },
  Offer_Received: { label: "Offer", variant: "success" },
  Accepted: { label: "Accepted", variant: "success" },
  Rejected: { label: "Rejected", variant: "error" },
  Withdrawn: { label: "Withdrawn", variant: "default" },
};

/* ─────────────── Dashboard Page ─────────────── */

function DashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [total, setTotal] = useState(0);
  const [byStatus, setByStatus] = useState<StatsByStatus>({});
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [recentApps, setRecentApps] = useState<JobApplication[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, interviewsRes, recentRes] = await Promise.allSettled([
          apiClient.get("/applications/stats"),
          apiClient.get("/interviews/upcoming", { params: { days: "7" } }),
          apiClient.get("/applications", { params: { limit: "5", sort: "-createdAt" } }),
        ]);

        if (statsRes.status === "fulfilled") {
          setTotal(statsRes.value.data.total || 0);
          setByStatus(statsRes.value.data.byStatus || {});
        }

        if (interviewsRes.status === "fulfilled") {
          setUpcomingInterviews(interviewsRes.value.data.data || []);
        }

        if (recentRes.status === "fulfilled") {
          setRecentApps(recentRes.value.data.data || []);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  // Derived metrics
  const active = total - (byStatus["Rejected"] || 0) - (byStatus["Withdrawn"] || 0) - (byStatus["Accepted"] || 0);
  const interviewCount = (byStatus["Interview_Scheduled"] || 0) + (byStatus["Interview_Completed"] || 0);
  const offers = (byStatus["Offer_Received"] || 0) + (byStatus["Accepted"] || 0);
  const rejections = byStatus["Rejected"] || 0;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const statCards = [
    { label: "Total Applications", value: total, icon: <Briefcase className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "Active", value: Math.max(0, active), icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Interviews", value: interviewCount, icon: <Clock className="h-4 w-4" />, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "Offers", value: offers, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Rejections", value: rejections, icon: <XCircle className="h-4 w-4" />, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Success Rate", value: successRate, icon: <Percent className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-500/10", suffix: "%" },
  ];

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Overview of your job search</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[...Array(6)].map((_, i) => (
                  <StatsCardSkeleton key={i} />
                ))}
              </div>
              <DashboardSkeleton />
            </>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map((stat, i) => (
                  <RevealOnScroll key={stat.label} delay={i * 0.05}>
                    <Card hover className="!border-orange-500/30 hover:!border-orange-500/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider leading-tight">{stat.label}</span>
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                          {stat.icon}
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        <CountUp target={stat.value} duration={1} />{stat.suffix || ""}
                      </div>
                    </Card>
                  </RevealOnScroll>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Interviews */}
                <RevealOnScroll delay={0.1}>
                  <Card className="h-full !border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Interviews (7 days)</h2>
                      <button
                        onClick={() => router.push("/calendar")}
                        className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {upcomingInterviews.length === 0 ? (
                      <EmptyState
                        icon={<Calendar className="h-5 w-5" />}
                        title="No upcoming interviews"
                        description="Schedule an interview from the calendar page."
                      />
                    ) : (
                      <div className="space-y-3">
                        {upcomingInterviews.map((interview) => (
                          <div
                            key={interview._id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/60 hover:bg-white/80 transition-all cursor-pointer"
                            onClick={() => router.push("/calendar")}
                          >
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{interview.companyName}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{interview.jobTitle}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium text-[var(--text-secondary)]">
                                {new Date(interview.interviewDate).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {new Date(interview.interviewDate).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </RevealOnScroll>

                {/* Recent Applications */}
                <RevealOnScroll delay={0.15}>
                  <Card className="h-full !border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Applications</h2>
                      <button
                        onClick={() => router.push("/applications")}
                        className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {recentApps.length === 0 ? (
                      <EmptyState
                        icon={<FileText className="h-5 w-5" />}
                        title="No applications yet"
                        description="Start tracking your job search."
                      />
                    ) : (
                      <div className="space-y-3">
                        {recentApps.map((app) => (
                          <div
                            key={app._id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/60 hover:bg-white/80 transition-all cursor-pointer"
                            onClick={() => router.push("/applications")}
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{app.companyName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-[var(--text-muted)] truncate">{app.jobTitle}</span>
                                {app.location && (
                                  <>
                                    <span className="text-[var(--text-muted)]">·</span>
                                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" />{app.location}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </RevealOnScroll>
              </div>

              {/* Status Breakdown */}
              {total > 0 && (
                <RevealOnScroll delay={0.2}>
                  <Card className="mt-6 !border-orange-500/20">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Application Pipeline</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {Object.entries(byStatus)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => {
                          const config = STATUS_CONFIG[status] || { label: status, variant: "default" as const };
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={status} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={config.variant} dot>{config.label}</Badge>
                                <span className="text-lg font-bold text-[var(--text-primary)]">{count}</span>
                              </div>
                              <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1">{pct}% of total</p>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                </RevealOnScroll>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <Sidebar>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
          <div className="h-7 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <DashboardSkeleton />
        </div>
      </Sidebar>
    }>
      <DashboardContent />
    </Suspense>
  );
}