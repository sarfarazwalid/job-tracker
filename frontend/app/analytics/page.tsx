"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  PieChart,
  Activity,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, RevealOnScroll } from "../components/motion-provider";
import { Button, Badge, Card, EmptyState, Skeleton } from "../components/ui";
import { cn } from "../lib/utils";

interface Application {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  appliedDate: string | null;
  aiFitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
}

interface CompanyStat {
  name: string;
  count: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        apiClient.get("/applications", { params: { limit: "500" } }),
        apiClient.get("/applications/stats"),
      ]);
      setApplications(appsRes.data.data || []);
      setStats(statsRes.data);
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  // Derived metrics
  const totalApps = applications.length;

  const statusCounts: Record<string, number> = {};
  applications.forEach((app) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  });

  const activeApps = applications.filter(
    (a) => !["Rejected", "Withdrawn", "Accepted"].includes(a.status)
  ).length;

  const interviewApps = applications.filter(
    (a) => ["Interview_Scheduled", "Interview_Completed"].includes(a.status)
  ).length;

  const offerApps = applications.filter(
    (a) => ["Offer_Received", "Accepted"].includes(a.status)
  ).length;

  const rejectedApps = applications.filter(
    (a) => a.status === "Rejected"
  ).length;

  // Success rate (% of non-rejected, non-withdrawn that got to offer/accepted)
  const successRate = totalApps > 0
    ? Math.round((offerApps / Math.max(totalApps - rejectedApps, 1)) * 100)
    : 0;

  // Company breakdown
  const companyMap = new Map<string, number>();
  applications.forEach((app) => {
    companyMap.set(app.companyName, (companyMap.get(app.companyName) || 0) + 1);
  });
  const topCompanies = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Average AI fit score
  const appsWithScores = applications.filter((a) => a.aiFitScore !== null);
  const avgFitScore = appsWithScores.length > 0
    ? Math.round(appsWithScores.reduce((sum, a) => sum + (a.aiFitScore || 0), 0) / appsWithScores.length)
    : null;

  // This week applications
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekApps = applications.filter((a) => new Date(a.createdAt) >= weekAgo).length;

  // Status distribution colors
  const statusColors: Record<string, string> = {
    Wishlist: "bg-zinc-500",
    Preparing: "bg-blue-400",
    Applied: "bg-blue-500",
    Assessment: "bg-amber-500",
    Interview_Scheduled: "bg-purple-400",
    Interview_Completed: "bg-purple-500",
    Offer_Received: "bg-emerald-400",
    Accepted: "bg-emerald-500",
    Rejected: "bg-red-500",
    Withdrawn: "bg-zinc-600",
  };

  const statusLabels: Record<string, string> = {
    Wishlist: "Wishlist",
    Preparing: "Preparing",
    Applied: "Applied",
    Assessment: "Assessment",
    Interview_Scheduled: "Interview Scheduled",
    Interview_Completed: "Interview Done",
    Offer_Received: "Offer Received",
    Accepted: "Accepted",
    Rejected: "Rejected",
    Withdrawn: "Withdrawn",
  };

  const maxStatusCount = Math.max(...Object.values(statusCounts), 1);

  if (isLoading) {
    return (
      <Sidebar>
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
              <Badge variant="purple">
                <BarChart3 className="h-3 w-3" />
                Insights
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Visualize your job search progress and performance metrics
            </p>
          </div>

          {applications.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No data to analyze"
                description="Add some applications to see your analytics and insights."
                action={
                  <Button onClick={() => router.push("/applications?create=true")}>
                    <Briefcase className="h-4 w-4" />
                    Add Application
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <RevealOnScroll>
                  <Card hover glow>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total</span>
                      <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-blue-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{totalApps}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                      <ArrowUpRight className="h-3 w-3" />
                      {thisWeekApps} this week
                    </div>
                  </Card>
                </RevealOnScroll>

                <RevealOnScroll delay={0.05}>
                  <Card hover glow>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Active</span>
                      <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-emerald-400">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{activeApps}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
                      {totalApps > 0 ? Math.round((activeApps / totalApps) * 100) : 0}% of total
                    </div>
                  </Card>
                </RevealOnScroll>

                <RevealOnScroll delay={0.1}>
                  <Card hover glow>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Interviews</span>
                      <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-purple-400">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{interviewApps}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)]">
                      {totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0}% conversion
                    </div>
                  </Card>
                </RevealOnScroll>

                <RevealOnScroll delay={0.15}>
                  <Card hover glow>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Offers</span>
                      <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-amber-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{offerApps}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                      <ArrowUpRight className="h-3 w-3" />
                      {successRate}% success rate
                    </div>
                  </Card>
                </RevealOnScroll>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Status Distribution */}
                <RevealOnScroll>
                  <Card>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-blue-400" />
                      Status Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(statusCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => {
                          const percentage = Math.round((count / maxStatusCount) * 100);
                          return (
                            <div key={status} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)]">{statusLabels[status] || status}</span>
                                <span className="font-semibold text-[var(--text-primary)]">{count}</span>
                              </div>
                              <div className="h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-500", statusColors[status] || "bg-zinc-500")}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                </RevealOnScroll>

                {/* Funnel / Pipeline */}
                <RevealOnScroll delay={0.1}>
                  <Card>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-400" />
                      Application Funnel
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Wishlist / Applying", statuses: ["Wishlist", "Preparing"], color: "bg-blue-400" },
                        { label: "Applied", statuses: ["Applied"], color: "bg-blue-500" },
                        { label: "Assessment", statuses: ["Assessment"], color: "bg-amber-500" },
                        { label: "Interview", statuses: ["Interview_Scheduled", "Interview_Completed"], color: "bg-purple-400" },
                        { label: "Offer", statuses: ["Offer_Received", "Accepted"], color: "bg-emerald-400" },
                        { label: "Rejected / Withdrawn", statuses: ["Rejected", "Withdrawn"], color: "bg-red-500" },
                      ].map((stage) => {
                        const count = stage.statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
                        const pct = maxStatusCount > 0 ? Math.round((count / maxStatusCount) * 100) : 0;
                        return (
                          <div key={stage.label} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[var(--text-secondary)]">{stage.label}</span>
                              <span className="font-semibold text-[var(--text-primary)]">{count}</span>
                            </div>
                            <div className="h-4 bg-[var(--bg-card)] rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </RevealOnScroll>
              </div>

              {/* AI Fit Score & Top Companies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Fit Score */}
                <RevealOnScroll>
                  <Card>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      AI Fit Score Overview
                    </h3>
                    {appsWithScores.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                        No AI fit scores available yet. Use the AI Insights page to analyze your applications.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-emerald-400">{avgFitScore}%</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Average Fit Score</p>
                            <p className="text-xs text-[var(--text-muted)]">Across {appsWithScores.length} applications</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {appsWithScores
                            .sort((a, b) => (b.aiFitScore || 0) - (a.aiFitScore || 0))
                            .slice(0, 5)
                            .map((app) => (
                              <div key={app._id} className="flex items-center justify-between py-1.5">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{app.jobTitle}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">{app.companyName}</p>
                                </div>
                                <span className={cn(
                                  "text-xs font-semibold",
                                  (app.aiFitScore || 0) >= 70 ? "text-emerald-400" : (app.aiFitScore || 0) >= 40 ? "text-amber-400" : "text-red-400"
                                )}>
                                  {app.aiFitScore}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </Card>
                </RevealOnScroll>

                {/* Top Companies */}
                <RevealOnScroll delay={0.1}>
                  <Card>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <Building2Icon className="h-4 w-4 text-blue-400" />
                      Top Companies
                    </h3>
                    {topCompanies.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] py-4 text-center">No companies yet</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider px-1">
                          <span>Company</span>
                          <span>Applications</span>
                        </div>
                        {topCompanies.map(([name, count], i) => {
                          const barPct = Math.round((count / topCompanies[0][1]) * 100);
                          return (
                            <div key={name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs px-1">
                                <span className="text-[var(--text-secondary)] flex items-center gap-2">
                                  <span className="text-[10px] text-[var(--text-muted)] w-4">{i + 1}.</span>
                                  {name}
                                </span>
                                <span className="font-semibold text-[var(--text-primary)]">{count}</span>
                              </div>
                              <div className="h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </RevealOnScroll>
              </div>
            </>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}

// Inline Building2Icon because it conflicts with the import
function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}