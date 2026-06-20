"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  MapPin,
  Globe,
  Briefcase,
  TrendingUp,
  Users,
  X,
  Loader2,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, RevealOnScroll } from "../components/motion-provider";
import { Button, Badge, Card, EmptyState } from "../components/ui";
import { formatRelativeDate, cn } from "../lib/utils";

interface Application {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  location: string;
  url: string;
  aiFitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyGroup {
  name: string;
  applications: Application[];
  locations: Set<string>;
  totalApps: number;
  activeApps: number;
  latestStatus: string;
  bestScore: number | null;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/applications", { params: { limit: "500" } });
      setApplications(data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  // Group applications by company name
  const companiesMap = new Map<string, CompanyGroup>();
  applications.forEach((app) => {
    const existing = companiesMap.get(app.companyName);
    if (existing) {
      existing.applications.push(app);
      existing.totalApps++;
      if (!["Rejected", "Withdrawn", "Accepted"].includes(app.status)) existing.activeApps++;
      if (app.location) existing.locations.add(app.location);
      if (app.aiFitScore && (existing.bestScore === null || app.aiFitScore > existing.bestScore)) {
        existing.bestScore = app.aiFitScore;
      }
    } else {
      const locations = new Set<string>();
      if (app.location) locations.add(app.location);
      companiesMap.set(app.companyName, {
        name: app.companyName,
        applications: [app],
        locations,
        totalApps: 1,
        activeApps: !["Rejected", "Withdrawn", "Accepted"].includes(app.status) ? 1 : 0,
        latestStatus: app.status,
        bestScore: app.aiFitScore || null,
      });
    }
  });

  const companies = Array.from(companiesMap.values())
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        Array.from(c.locations).some((l) => l.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.totalApps - a.totalApps);

  const totalCompanies = companiesMap.size;
  const activeCompanies = Array.from(companiesMap.values()).filter((c) => c.activeApps > 0).length;

  const statusColor = (status: string) => {
    if (["Offer_Received", "Accepted"].includes(status)) return "text-emerald-400";
    if (["Interview_Scheduled", "Interview_Completed"].includes(status)) return "text-purple-400";
    if (status === "Rejected" || status === "Withdrawn") return "text-red-400";
    return "text-blue-400";
  };

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Companies</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Track your applications organized by company
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30 transition-all w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <RevealOnScroll>
              <Card hover glow>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Companies</span>
                  <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-blue-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)]">{totalCompanies}</div>
              </Card>
            </RevealOnScroll>
            <RevealOnScroll delay={0.05}>
              <Card hover glow>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Active</span>
                  <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)]">{activeCompanies}</div>
              </Card>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <Card hover glow>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Apps</span>
                  <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-purple-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)]">{applications.length}</div>
              </Card>
            </RevealOnScroll>
          </div>

          {/* Companies List */}
          {companies.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title={searchQuery ? "No companies found" : "No applications yet"}
                description={searchQuery ? `No companies match "${searchQuery}"` : "Add your first application to see companies here."}
                action={
                  !searchQuery ? (
                    <Button onClick={() => router.push("/applications?create=true")}>
                      <Briefcase className="h-4 w-4" />
                      Add Application
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {companies.map((company, index) => (
                <RevealOnScroll key={company.name} delay={index * 0.03}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card hover>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{company.name}</h3>
                              {company.locations.size > 0 && (
                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {Array.from(company.locations).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--text-primary)]">{company.totalApps}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Apps</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-400">{company.activeApps}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Active</p>
                          </div>
                          {company.bestScore && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-purple-400">{company.bestScore}%</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Best Fit</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Applications for this company */}
                      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <div className="space-y-2">
                          {company.applications.slice(0, 5).map((app) => (
                            <div
                              key={app._id}
                              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {app.jobTitle}
                                </span>
                                <Badge
                                  variant={
                                    app.status === "Offer_Received" || app.status === "Accepted"
                                      ? "success"
                                      : app.status === "Rejected" || app.status === "Withdrawn"
                                      ? "error"
                                      : app.status === "Interview_Scheduled" || app.status === "Interview_Completed"
                                      ? "purple"
                                      : "info"
                                  }
                                >
                                  {app.status.replace(/_/g, " ")}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {app.aiFitScore && (
                                  <span className="text-xs font-medium text-emerald-400">{app.aiFitScore}%</span>
                                )}
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {formatRelativeDate(app.updatedAt || app.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                          {company.applications.length > 5 && (
                            <button
                              onClick={() => router.push("/applications")}
                              className="w-full text-center text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] py-1.5 transition-colors"
                            >
                              View all {company.totalApps} applications →
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}