"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useReducer, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Columns3,
  Calendar,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Bell,
  ChevronDown,
  CalendarPlus,
  Circle,
  ScanSearch,
} from "lucide-react";
import { cn } from "../lib/utils";
import { GlassCard, AnimatedDropdown, StatusTag, AmberButton } from "./primitives";
import { Avatar, Input, Select, Button } from "./ui";
import AIChatWidget from "./AIChatWidget";
import { Logo } from "./logo";
import apiClient from "../lib/api";
import { formatRelativeDate } from "../lib/utils";

/* ─────────────── Types ─────────────── */

interface SidebarProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number | null;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string | null;
}

interface Stats {
  applied: number;
  interviews: number;
  offers: number;
}

/* ─────────────── Navigation Config ─────────────── */

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/applications", label: "Applications", icon: FileText, exact: false },
  { href: "/kanban", label: "Kanban Board", icon: Columns3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-analyze", label: "AI Analyze", icon: ScanSearch },
  { href: "/notifications", label: "Notifications", icon: Bell, exact: true, badge: 0 },
];

/* ─────────────── Main Sidebar ─────────────── */

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(false);

  const [stats, setStats] = useState<Stats>({ applied: 0, interviews: 0, offers: 0 });

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await apiClient.get("/notifications/unread-count");
        setUnreadCount(data.count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    setNotifError(false);
    try {
      const { data } = await apiClient.get("/notifications", { params: { limit: "20" } });
      setNotifications(data.data || []);
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    } catch {
      setNotifError(true);
    }
    setLoadingNotifs(false);
  };

  const openNotifications = () => {
    setShowNotifications(true);
    fetchNotifications();
  };

  useEffect(() => {
    if (!showNotifications) return;
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [showNotifications]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: apps } = await apiClient.get("/applications", { params: { limit: "200" } });
        const list: any[] = apps.data || [];
        const applied = list.filter((a: any) => !["Rejected", "Withdrawn", "Accepted"].includes(a.status)).length;
        const interviews = list.filter((a: any) => ["Interview_Scheduled", "Interview_Completed"].includes(a.status)).length;
        const offers = list.filter((a: any) => ["Offer_Received", "Accepted"].includes(a.status)).length;
        setStats({ applied, interviews, offers });
      } catch {}
    };
    fetchStats();
  }, []);

  const markAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
    setShowNotifications(false);
    if (actionUrl) router.push(actionUrl);
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) await apiClient.post("/auth/logout", { refresh: refreshToken });
    } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="flex h-screen bg-[#0D0F12] overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-[240px] xl:w-[260px] 2xl:w-[280px] border-r border-white/[0.08] bg-[#16191D]/80 backdrop-blur-md relative z-30 shrink-0">
          <div className="flex items-center h-14 border-b border-white/[0.08] shrink-0 px-4">
            <Logo size="md" className="w-full" />
          </div>

          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact === false
                ? pathname.startsWith(item.href) && pathname !== "/kanban" && pathname !== "/calendar" && pathname !== "/companies" && pathname !== "/analytics" && pathname !== "/settings" && pathname !== "/notifications"
                : pathname === item.href;
              const displayBadge = item.href === "/notifications" && unreadCount > 0 ? unreadCount : item.badge;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--transition-fast)] group relative",
                    isActive
                      ? "bg-[var(--accent-glow-strong)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {displayBadge !== null && displayBadge !== undefined && displayBadge > 0 && (
                    <StatusTag className="ml-auto">
                      {displayBadge > 99 ? "99+" : displayBadge}
                    </StatusTag>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 pb-1 px-3 space-y-1">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">Quick Actions</span>
              <button
                onClick={() => setShowAddAppModal(true)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-3 text-[var(--accent-primary)]" />
                <span>Add Application</span>
              </button>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
              >
                <Building2 className="h-4 w-3 text-[var(--accent-primary)]" />
                <span>Add Company</span>
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
              >
                <CalendarPlus className="h-4 w-3 text-[var(--accent-primary)]" />
                <span>Set Interview</span>
              </button>
            </div>

            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Snapshot</span>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-cyan-400 text-cyan-400" />
                    Applied
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] mono-number">{stats.applied}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
                    Interviews
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] mono-number">{stats.interviews}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Circle className="h-2 w-2 fill-[var(--status-success)] text-[var(--status-success)]" />
                    Offers
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] mono-number">{stats.offers}</span>
                </div>
              </div>
            </div>
          </nav>

          <div className="border-t border-white/[0.08]">
            <div className="relative border-t border-white/[0.08] p-3" ref={accountRef}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <Avatar name={user?.username || "U"} size="sm" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.username || "User"}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email || ""}</p>
                  </div>
                  <motion.span animate={{ rotate: showAccountMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </motion.span>
                </button>
              </div>

              <AnimatePresence>
                {showAccountMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-1 left-3 right-3 bg-[#16191D] border border-white/[0.08] rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => { router.push("/settings"); setShowAccountMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>
                      <div className="border-t border-white/[0.08] my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--status-error)] hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* ── Mobile Sidebar ── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-[260px] sm:w-[280px] bg-[#16191D] border-r border-white/[0.08] z-50 lg:hidden flex flex-col"
              >
                <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.08]">
                <Logo size="sm" />
                  <button onClick={() => setMobileOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = item.exact === false
                      ? pathname.startsWith(item.href) && pathname !== "/kanban" && pathname !== "/calendar" && pathname !== "/companies" && pathname !== "/analytics" && pathname !== "/settings"
                      : pathname === item.href;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[var(--accent-glow-strong)] text-[var(--accent-primary)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <div className="pt-4 pb-1 px-3">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Quick Actions</span>
                  </div>
                  <button
                    onClick={() => { setShowAddAppModal(true); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>Add Application</span>
                  </button>
                  <button
                    onClick={() => { setShowScheduleModal(true); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                  >
                    <CalendarPlus className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span>Set Interview</span>
                  </button>
                </nav>
                <div className="border-t border-white/[0.08] p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.username || "U"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.username || "User"}</p>
                    </div>
                    <button onClick={handleLogout} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer" title="Sign out">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/[0.08] bg-[#16191D]/80 backdrop-blur-md">
            <button onClick={() => setMobileOpen(true)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>
            <Logo size="sm" />
            <button
              onClick={() => router.push("/notifications")}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[9px] font-bold text-[var(--text-inverse)] bg-[var(--status-error)] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      <AddApplicationModal
        isOpen={showAddAppModal}
        onClose={() => setShowAddAppModal(false)}
        onSuccess={() => { setShowAddAppModal(false); router.refresh(); }}
        onAnalyze={(data) => {
          setShowAddAppModal(false);
          router.push(`/ai-analyze?company=${encodeURIComponent(data.companyName)}&title=${encodeURIComponent(data.jobTitle)}&jd=${encodeURIComponent(data.jobDescription || '')}`);
        }}
      />
      <AddCompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSuccess={(companyData) => {
          setShowCompanyModal(false);
          router.refresh();
        }}
        onAddApplication={(companyData) => {
          setShowCompanyModal(false);
          setShowAddAppModal(true);
        }}
      />
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => { setShowScheduleModal(false); router.refresh(); }}
      />
      <AIChatWidget />
    </>
  );
}

function AddApplicationModal({ isOpen, onClose, onSuccess, onAnalyze }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; onAnalyze?: (data: any) => void }) {
  const [form, setForm] = useState({ companyName: "", jobTitle: "", status: "", location: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const created = await apiClient.post("/applications", form);
      onSuccess();
      setForm({ companyName: "", jobTitle: "", status: "Wishlist", location: "", notes: "" });
      if (onAnalyze) {
        onAnalyze({ companyName: created.data?.companyName, jobTitle: created.data?.jobTitle, jobDescription: created.data?.jobDescription || '' });
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create application");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#16191D]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Application</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Company" placeholder="e.g. Google" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          <Input label="Job Title" placeholder="e.g. Frontend Developer" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} required />
          <Select label="Status" options={[{ value: "", label: "Select status..." }, { value: "Wishlist", label: "Wishlist" }, { value: "Applied", label: "Applied" }, { value: "Preparing", label: "Preparing" }]} value={form.status} onChange={(val) => setForm({ ...form, status: val })} />
          <Input label="Location" placeholder="e.g. Remote" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create</Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

function AddCompanyModal({ isOpen, onClose, onSuccess, onAddApplication }: { isOpen: boolean; onClose: () => void; onSuccess?: (data: any) => void; onAddApplication?: (data: any) => void }) {
  const [form, setForm] = useState({ companyName: "", website: "", industry: "", companySize: "", headquarters: "", recruiterName: "", recruiterEmail: "", linkedInUrl: "", companyNotes: "", interviewExperienceNotes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post("/companies", form);
      onSuccess?.(response.data);
      setForm({ companyName: "", website: "", industry: "", companySize: "", headquarters: "", recruiterName: "", recruiterEmail: "", linkedInUrl: "", companyNotes: "", interviewExperienceNotes: "" });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create company");
    }
    setLoading(false);
  };

  const handleSaveAndAddApp = async () => {
    if (!form.companyName.trim()) { setError("Company name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.post("/companies", { companyName: form.companyName });
      onAddApplication?.(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create company");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#16191D]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Company</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
        <p className="text-xs text-[var(--text-secondary)] mb-4">Store company information and recruiter details for future applications.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Company Name *" placeholder="e.g. Google" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          <Input label="Website" placeholder="https://example.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Industry" options={[{ value: "", label: "Select industry" }, { value: "Technology", label: "Technology" }, { value: "Finance", label: "Finance" }, { value: "Healthcare", label: "Healthcare" }, { value: "Education", label: "Education" }, { value: "E-commerce", label: "E-commerce" }, { value: "Consulting", label: "Consulting" }, { value: "Other", label: "Other" }]} value={form.industry} onChange={(val) => setForm({ ...form, industry: val })} />
            <Select label="Company Size" options={[{ value: "", label: "Select size" }, { value: "1-10", label: "1-10" }, { value: "11-50", label: "11-50" }, { value: "51-200", label: "51-200" }, { value: "201-500", label: "201-500" }, { value: "501-1000", label: "501-1000" }, { value: "1000+", label: "1000+" }]} value={form.companySize} onChange={(val) => setForm({ ...form, companySize: val })} />
          </div>
          <Input label="Headquarters" placeholder="e.g. Mountain View, CA" value={form.headquarters} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Recruiter Name" placeholder="e.g. John Doe" value={form.recruiterName} onChange={(e) => setForm({ ...form, recruiterName: e.target.value })} />
            <Input label="Recruiter Email" placeholder="e.g. recruiter@company.com" type="email" value={form.recruiterEmail} onChange={(e) => setForm({ ...form, recruiterEmail: e.target.value })} />
          </div>
          <Input label="LinkedIn URL" placeholder="https://linkedin.com/company/..." value={form.linkedInUrl} onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Company Notes</label>
            <textarea value={form.companyNotes} onChange={(e) => setForm({ ...form, companyNotes: e.target.value })} className="w-full h-20 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none" placeholder="General notes about this company..." />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Interview Experience Notes</label>
            <textarea value={form.interviewExperienceNotes} onChange={(e) => setForm({ ...form, interviewExperienceNotes: e.target.value })} className="w-full h-20 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none" placeholder="Share your interview experience..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="secondary" onClick={handleSaveAndAddApp} loading={loading}>Save & Add Application</Button>
            <Button type="submit" loading={loading}>Save Company</Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

/* ─────────────── WheelPicker ─────────────── */
interface WheelPickerProps {
  values: (number | string)[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight?: number;
  visibleItems?: number;
}

function WheelPicker({ values, selectedIndex, onChange, itemHeight = 36, visibleItems = 5 }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);

  const listHeight = visibleItems * itemHeight;
  const centerY = listHeight / 2;

  // Sync offset when selectedIndex changes externally
  useEffect(() => {
    setOffsetY(-selectedIndex * itemHeight);
  }, [selectedIndex, itemHeight]);

  const snapToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, values.length - 1));
    setOffsetY(-clamped * itemHeight);
    onChange(clamped);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    velocity.current = delta * 0.5;
    const newOffset = offsetY - delta;
    const maxOffset = 0;
    const minOffset = -(values.length - 1) * itemHeight;
    setOffsetY(Math.max(minOffset, Math.min(maxOffset, newOffset)));

    // Inertia
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const inertia = () => {
      velocity.current *= 0.92;
      if (Math.abs(velocity.current) < 1) {
        // Snap
        const idx = Math.round(-offsetY / itemHeight);
        snapToIndex(idx);
        return;
      }
      const newOff = offsetY - velocity.current;
      const clampedOff = Math.max(minOffset, Math.min(maxOffset, newOff));
      setOffsetY(clampedOff);
      rafId.current = requestAnimationFrame(inertia);
    };
    rafId.current = requestAnimationFrame(inertia);
  }, [offsetY, values.length, itemHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastY.current = e.clientY;
    velocity.current = 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dy = lastY.current - e.clientY;
    lastY.current = e.clientY;
    velocity.current = dy;
    const newOffset = offsetY - dy;
    const maxOffset = 0;
    const minOffset = -(values.length - 1) * itemHeight;
    setOffsetY(Math.max(minOffset, Math.min(maxOffset, newOffset)));
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Inertia snap
    const inertia = () => {
      velocity.current *= 0.9;
      if (Math.abs(velocity.current) < 0.5) {
        const idx = Math.round(-offsetY / itemHeight);
        snapToIndex(idx);
        return;
      }
      const newOff = offsetY - velocity.current;
      const maxOffset = 0;
      const minOffset = -(values.length - 1) * itemHeight;
      const clampedOff = Math.max(minOffset, Math.min(maxOffset, newOff));
      setOffsetY(clampedOff);
    };
    rafId.current = requestAnimationFrame(inertia);
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden"
      style={{ height: listHeight }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Gradient fade masks */}
      <div className="absolute inset-x-0 top-0 h-[calc(50%-18px)] bg-gradient-to-b from-[#16191D] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[calc(50%-18px)] bg-gradient-to-t from-[#16191D] to-transparent z-10 pointer-events-none" />

      {/* Center highlight indicator */}
      <div
        className="absolute left-2 right-2 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 z-[1] pointer-events-none"
        style={{ top: centerY - itemHeight / 2, height: itemHeight }}
      />

      {/* Items */}
      <div
        className="absolute inset-x-0 flex flex-col items-center transition-none"
        style={{ transform: `translateY(${centerY + offsetY - itemHeight / 2}px)` }}
      >
        {values.map((val, i) => {
          const itemCenter = i * itemHeight + itemHeight / 2;
          const distance = Math.abs(itemCenter + offsetY);
          const isCenter = distance < itemHeight / 2 + 1;
          const opacity = Math.max(0.15, 1 - distance / (itemHeight * (visibleItems / 2 + 0.5)));
          return (
            <div
              key={i}
              className="flex items-center justify-center cursor-pointer transition-all duration-100"
              style={{ height: itemHeight, opacity }}
              onClick={() => snapToIndex(i)}
            >
              <span
                className={cn(
                  "text-sm font-medium transition-all",
                  isCenter
                    ? "text-[var(--accent-primary)] font-bold scale-110"
                    : "text-[var(--text-muted)]"
                )}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleInterviewModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ applicationId: "", interviewDate: "", interviewTime: "", interviewType: "video", duration: "60", location: "", notes: "" });
  const [apps, setApps] = useState<{ _id: string; companyName: string; jobTitle: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState("");

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Wheel picker indices
  const initialHourIdx = today.getHours() % 12 || 12;
  const [hourIdx, setHourIdx] = useState(initialHourIdx - 1);
  const [minuteIdx, setMinuteIdx] = useState(() => Math.round(today.getMinutes() / 5) * 5);
  const [periodIdx, setPeriodIdx] = useState(today.getHours() >= 12 ? 1 : 0);

  const selectedHour12 = hourIdx + 1;
  const selectedMinute = minuteIdx;
  const selectedPeriod: "AM" | "PM" = periodIdx === 0 ? "AM" : "PM";

  const hourValues = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minuteValues = useMemo(() => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")), []);
  const periodValues = ["AM", "PM"];

  useEffect(() => {
    if (isOpen) {
      setLoadingApps(true);
      apiClient.get("/applications", { params: { limit: "100" } })
        .then(({ data }) => setApps(data.data || []))
        .catch(() => {})
        .finally(() => setLoadingApps(false));
      // Reset state
      setCurrentMonth(today.getMonth());
      setCurrentYear(today.getFullYear());
      setSelectedDate(null);
      const h = today.getHours();
      setHourIdx((h % 12) - 1 || 0);
      setMinuteIdx(Math.round(today.getMinutes() / 5) * 5);
      setPeriodIdx(h >= 12 ? 1 : 0);
    }
  }, [isOpen]);

  // Build interviewDate from selectedDate + wheel values
  useEffect(() => {
    if (selectedDate) {
      let hour24 = selectedHour12;
      if (selectedPeriod === "PM" && selectedHour12 !== 12) hour24 += 12;
      if (selectedPeriod === "AM" && selectedHour12 === 12) hour24 = 0;
      const d = new Date(selectedDate);
      d.setHours(hour24, selectedMinute, 0, 0);
      const pad = (n: number) => n.toString().padStart(2, "0");
      setForm((prev) => ({
        ...prev,
        interviewDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      }));
    }
  }, [selectedDate, selectedHour12, selectedMinute, selectedPeriod]);

  // Calendar helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    // Leading blanks
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth, currentYear, firstDayOfMonth, daysInMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handleDateClick = (day: number) => {
    if (isPast(day)) return;
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicationId || !form.interviewDate) return;
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/interviews", { ...form, duration: parseInt(form.duration, 10) });
      onSuccess?.();
      setForm({ applicationId: "", interviewDate: "", interviewTime: "", interviewType: "video", duration: "60", location: "", notes: "" });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to schedule interview");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-[#16191D]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Schedule Interview</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Application Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Application</label>
            {loadingApps ? (
              <div className="h-10 bg-white/[0.04] border border-white/[0.08] rounded-md flex items-center justify-center text-xs text-[var(--text-muted)]">Loading...</div>
            ) : (
              <select
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer appearance-none"
                required
              >
                <option value="">Select an application...</option>
                {apps.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.companyName} — {app.jobTitle}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Calendar + Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Calendar Column */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Select Date</label>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{monthNames[currentMonth]} {currentYear}</span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {dayNames.map((name) => (
                    <div key={name} className="text-[10px] font-medium text-[var(--text-muted)] text-center h-6 flex items-center justify-center">
                      {name}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`blank-${i}`} className="h-7" />;
                    }
                    const past = isPast(day);
                    const todayFlag = isToday(day);
                    const selected = isSelected(day);
                    return (
                      <motion.button
                        key={day}
                        type="button"
                        disabled={past}
                        onClick={() => handleDateClick(day)}
                        whileHover={!past ? { scale: 1.1 } : undefined}
                        whileTap={!past ? { scale: 0.95 } : undefined}
                        className={cn(
                          "h-7 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
                          past && "opacity-20 cursor-not-allowed",
                          selected && "bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-sm",
                          !selected && !past && todayFlag && "border border-[var(--accent-primary)]/50 text-[var(--accent-primary)]",
                          !selected && !past && !todayFlag && "text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Wheel Picker Column */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">Select Time</label>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-2 flex gap-1">
                <div className="flex-1">
                  <WheelPicker
                    values={hourValues}
                    selectedIndex={hourIdx}
                    onChange={(i) => setHourIdx(i)}
                    itemHeight={34}
                    visibleItems={5}
                  />
                  <div className="text-center text-[10px] text-[var(--text-muted)] mt-1">Hour</div>
                </div>
                <div className="text-[var(--text-muted)] text-lg flex items-center justify-center px-0.5 font-light">:</div>
                <div className="flex-1">
                  <WheelPicker
                    values={minuteValues}
                    selectedIndex={minuteIdx}
                    onChange={(i) => setMinuteIdx(i)}
                    itemHeight={34}
                    visibleItems={5}
                  />
                  <div className="text-center text-[10px] text-[var(--text-muted)] mt-1">Min</div>
                </div>
                <div className="w-10">
                  <WheelPicker
                    values={periodValues}
                    selectedIndex={periodIdx}
                    onChange={(i) => setPeriodIdx(i)}
                    itemHeight={34}
                    visibleItems={5}
                  />
                  <div className="text-center text-[10px] text-[var(--text-muted)] mt-1">Period</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Type + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Type</label>
              <select
                value={form.interviewType}
                onChange={(e) => setForm({ ...form, interviewType: e.target.value })}
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer appearance-none"
              >
                {[{ value: "phone", label: "Phone" }, { value: "video", label: "Video" }, { value: "onsite", label: "On-site" }, { value: "technical", label: "Technical" }, { value: "behavioral", label: "Behavioral" }, { value: "final", label: "Final" }].map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer appearance-none"
              >
                {[{ value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "1 hour" }, { value: "90", label: "1.5 hours" }, { value: "120", label: "2 hours" }].map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location / Link */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Location / Link</label>
            <input
              type="text"
              placeholder="e.g. Google Meet link"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          {/* Hidden datetime input for submission */}
          <input type="hidden" name="interviewDate" value={form.interviewDate} />

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={loading || !form.applicationId || !form.interviewDate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="h-9 px-5 rounded-lg bg-[var(--accent-primary)] text-[var(--text-inverse)] text-xs font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              {loading ? (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              {loading ? "Scheduling..." : "Schedule Interview"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </ModalOverlay>
  );
}

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}