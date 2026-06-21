"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowUpRight,
  MapPin,
  Calendar,
  FileText,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, CountUp, RevealOnScroll } from "../components/motion-provider";
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  Badge,
  EmptyState,
} from "../components/ui";
import { AnimatedDropdown } from "../components/primitives";
import { ApplicationListSkeleton, StatsCardSkeleton } from "../components/skeletons";
import { formatRelativeDate, cn } from "../lib/utils";

interface JobApplication {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  appliedDate: string | null;
  notes: string;
  jobDescription: string;
  location: string;
  salaryRange: string;
  url: string;
  aiFitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: JobApplication[];
  nextCursor: string | null;
  hasMore: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "info" | "purple" | "warning" | "success" | "error"; dot: boolean }> = {
  Wishlist: { label: "Wishlist", variant: "default", dot: true },
  Preparing: { label: "Preparing", variant: "info", dot: true },
  Applied: { label: "Applied", variant: "info", dot: true },
  Assessment: { label: "Assessment", variant: "warning", dot: true },
  Interview_Scheduled: { label: "Interview Scheduled", variant: "purple", dot: true },
  Interview_Completed: { label: "Interview Done", variant: "purple", dot: true },
  Offer_Received: { label: "Offer", variant: "success", dot: true },
  Accepted: { label: "Accepted", variant: "success", dot: true },
  Rejected: { label: "Rejected", variant: "error", dot: true },
  Withdrawn: { label: "Withdrawn", variant: "default", dot: true },
};

const ALL_STATUSES = [
  "Wishlist", "Preparing", "Applied", "Assessment",
  "Interview_Scheduled", "Interview_Completed", "Offer_Received",
  "Accepted", "Rejected", "Withdrawn",
];

const STATUS_OPTIONS = ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label || s }));

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "companyName", label: "Company A-Z" },
  { value: "-companyName", label: "Company Z-A" },
  { value: "status", label: "Status" },
  { value: "-updatedAt", label: "Recently Updated" },
  { value: "appliedDate", label: "Applied Date" },
];

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApp, setNewApp] = useState({ companyName: "", jobTitle: "", status: "Wishlist", notes: "", location: "", salaryRange: "" });
  const [creating, setCreating] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, interviews: 0, offers: 0 });

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateForm(true);
    }
  }, [searchParams]);

  const fetchApplications = useCallback(async (cursor?: string, append = false) => {
    if (!cursor) setIsLoading(true);
    else setLoadingMore(true);
    setError("");

    try {
      const params: Record<string, string> = { limit: "50", sort: sortBy };
      if (cursor) params.cursor = cursor;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get("/applications", { params });
      const data: PaginatedResponse = response.data;

      if (append) {
        setApplications((prev) => [...prev, ...data.data]);
      } else {
        setApplications(data.data);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);

      // Calculate stats from the full dataset (first page only for accuracy)
      if (!append) {
        const total = data.data.length;
        const active = data.data.filter((a: JobApplication) => !["Rejected", "Withdrawn", "Accepted"].includes(a.status)).length;
        const interviews = data.data.filter((a: JobApplication) => ["Interview_Scheduled", "Interview_Completed"].includes(a.status)).length;
        const offers = data.data.filter((a: JobApplication) => ["Offer_Received", "Accepted"].includes(a.status)).length;
        setStats({ total, active, interviews, offers });
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load applications. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [router, sortBy, statusFilter, searchQuery]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchApplications();
    }
  }, [statusFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        fetchApplications();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post("/applications", newApp);
      setNewApp({ companyName: "", jobTitle: "", status: "Wishlist", notes: "", location: "", salaryRange: "" });
      setShowCreateForm(false);
      await fetchApplications();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create application");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/applications/${id}`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      );
      const updated = applications.map((app) => (app._id === id ? { ...app, status: newStatus } : app));
      const total = updated.length;
      const active = updated.filter((a) => !["Rejected", "Withdrawn", "Accepted"].includes(a.status)).length;
      const interviews = updated.filter((a) => ["Interview_Scheduled", "Interview_Completed"].includes(a.status)).length;
      const offers = updated.filter((a) => ["Offer_Received", "Accepted"].includes(a.status)).length;
      setStats({ total, active, interviews, offers });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete application");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSortBy("-createdAt");
  };

  const hasActiveFilters = searchQuery || statusFilter || sortBy !== "-createdAt";

  const statCards = [
    { label: "Total", value: stats.total, icon: <Briefcase className="h-4 w-4" />, color: "text-blue-400" },
    { label: "Active", value: stats.active, icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Interviews", value: stats.interviews, icon: <Clock className="h-4 w-4" />, color: "text-purple-400" },
    { label: "Offers", value: stats.offers, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-amber-400" },
  ];

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Applications</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Manage all your job applications</p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreateForm ? "Cancel" : "New Application"}
            </Button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between"
              >
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Card className="mb-6">
                  <form onSubmit={handleCreate} className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Application</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        label="Company Name"
                        placeholder="e.g. Google"
                        value={newApp.companyName}
                        onChange={(e) => setNewApp({ ...newApp, companyName: e.target.value })}
                        required
                      />
                      <Input
                        label="Job Title"
                        placeholder="e.g. Senior Frontend Developer"
                        value={newApp.jobTitle}
                        onChange={(e) => setNewApp({ ...newApp, jobTitle: e.target.value })}
                        required
                      />
                      <Select
                        label="Status"
                        options={STATUS_OPTIONS}
                        value={newApp.status}
                        onChange={(val) => setNewApp({ ...newApp, status: val })}
                      />
                      <Input
                        label="Location"
                        placeholder="e.g. San Francisco, CA"
                        value={newApp.location}
                        onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                      />
                      <Input
                        label="Salary Range"
                        placeholder="e.g. $120k - $150k"
                        value={newApp.salaryRange}
                        onChange={(e) => setNewApp({ ...newApp, salaryRange: e.target.value })}
                      />
                    </div>
                    <Textarea
                      label="Notes"
                      placeholder="Any additional notes..."
                      value={newApp.notes}
                      onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" loading={creating}>
                        Create Application
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, i) => (
                <RevealOnScroll key={stat.label} delay={i * 0.05}>
                  <Card hover className="!rounded-2xl">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] sm:text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
                      <div className={cn("h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0", stat.color)}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-none">
                      <CountUp target={stat.value} duration={1} />
                    </div>
                  </Card>
                </RevealOnScroll>
              ))}
            </div>
          )}

          {/* Filters Bar */}
          <RevealOnScroll delay={0.1}>
            <Card padding="sm" className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by company, title, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full pl-9 pr-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative pl-8">
                  <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none z-10" />
                  <AnimatedDropdown
                    options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
                    value={statusFilter}
                    onChange={(val: string) => setStatusFilter(val)}
                    placeholder="All Statuses"
                    className="w-auto"
                  />
                </div>

                {/* Sort */}
                <div className="relative pl-8">
                  <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none z-10" />
                  <AnimatedDropdown
                    options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    value={sortBy}
                    onChange={(val: string) => setSortBy(val)}
                    placeholder="Newest First"
                    className="w-auto"
                  />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="h-9 px-3 text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>
            </Card>
          </RevealOnScroll>

          {/* Loading */}
          {isLoading && <ApplicationListSkeleton />}

          {/* Empty State */}
          {!isLoading && !error && applications.length === 0 && (
            <RevealOnScroll>
              <Card>
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No applications yet"
                  description="Start tracking your job search by adding your first application."
                  action={
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4" />
                      New Application
                    </Button>
                  }
                />
              </Card>
            </RevealOnScroll>
          )}

          {/* Applications Table */}
          {!isLoading && applications.length > 0 && (
            <RevealOnScroll delay={0.15}>
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl overflow-x-auto">
                {/* Table header - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1fr)_minmax(130px,140px)_minmax(90px,100px)_minmax(100px,120px)_minmax(80px,100px)_minmax(70px,80px)] gap-4 px-5 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] bg-[var(--bg-card)] min-w-[640px]">
                  <div>Company / Position</div>
                  <div>Status</div>
                  <div>Location</div>
                  <div>Applied</div>
                  <div className="text-right">AI Score</div>
                  <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-[var(--border-default)]">
                  {applications.map((app, index) => {
                    const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.Wishlist;
                    return (
                      <motion.div
                        key={app._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        className="group"
                      >
                        {/* Desktop Row */}
                        <div className="hidden lg:grid lg:grid-cols-[minmax(180px,1fr)_minmax(130px,140px)_minmax(90px,100px)_minmax(100px,120px)_minmax(80px,100px)_minmax(70px,80px)] gap-4 items-center px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors min-w-[640px] relative">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{app.companyName}</h3>
                            <p className="text-xs text-[var(--text-secondary)] truncate">{app.jobTitle}</p>
                            {app.salaryRange && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{app.salaryRange}</p>
                            )}
                          </div>
                          <div>
                            <AnimatedDropdown
                              options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label || s }))}
                              value={app.status}
                              onChange={(val) => handleStatusChange(app._id, val)}
                              className="text-xs"
                            />
                          </div>
                          <div className="text-xs text-[var(--text-muted)] truncate">
                            {app.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {app.location}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {app.appliedDate
                              ? new Date(app.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : formatRelativeDate(app.createdAt)}
                          </div>
                          <div className="text-right">
                            {app.aiFitScore ? (
                              <span className="text-sm font-semibold text-emerald-400">{app.aiFitScore}%</span>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDelete(app._id)}
                              className="h-7 w-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Row */}
                        <div className="lg:hidden px-4 py-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{app.companyName}</h3>
                              <p className="text-xs text-[var(--text-secondary)] truncate">{app.jobTitle}</p>
                            </div>
                            <Badge variant={statusConfig.variant} dot={statusConfig.dot}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-2">
                            {app.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location}</span>}
                            {app.salaryRange && <span>{app.salaryRange}</span>}
                            {app.aiFitScore && <span className="text-emerald-400 font-medium">AI: {app.aiFitScore}%</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <AnimatedDropdown
                              options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s]?.label || s }))}
                              value={app.status}
                              onChange={(val) => handleStatusChange(app._id, val)}
                              className="text-xs"
                            />
                            <button
                              onClick={() => handleDelete(app._id)}
                              className="h-7 w-7 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Notes (shared) */}
                        {app.notes && (
                          <div className="px-5 pb-3 -mt-1 hidden lg:block">
                            <p className="text-xs text-[var(--text-muted)] line-clamp-1">{app.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </RevealOnScroll>
          )}

          {/* No search results */}
          {!isLoading && applications.length > 0 && applications.length === 0 && (
            <Card>
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No results found"
                description={`No applications match your filters.`}
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                }
              />
            </Card>
          )}

          {/* Load more */}
          {hasMore && !isLoading && (
            <div className="mt-4 text-center">
              <Button
                variant="secondary"
                onClick={() => fetchApplications(nextCursor!, true)}
                loading={loadingMore}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <Sidebar>
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <div className="h-7 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse mb-8" />
        </div>
      </Sidebar>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}