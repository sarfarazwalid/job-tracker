"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  FileText,
  Clock,
  Gift,
  AlertTriangle,
  Sparkles,
  CheckCheck,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  Filter,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, RevealOnScroll } from "../components/motion-provider";
import { Button, Badge, Card, EmptyState } from "../components/ui";
import { cn } from "../lib/utils";

/* ─────────────── Types ─────────────── */

interface Notification {
  _id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  read: boolean;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  actionUrl: string | null;
  createdAt: string;
}

/* ─────────────── Constants ─────────────── */

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "interview", label: "Interviews" },
  { value: "application", label: "Applications" },
  { value: "follow_up", label: "Follow-Ups" },
  { value: "offer", label: "Offers" },
  { value: "deadline", label: "Deadlines" },
  { value: "ai_insight", label: "AI Insights" },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  interview: { icon: Calendar, color: "text-purple-400", bgColor: "bg-purple-500/10", label: "Interview" },
  application: { icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/10", label: "Application" },
  follow_up: { icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/10", label: "Follow-Up" },
  offer: { icon: Gift, color: "text-emerald-400", bgColor: "bg-emerald-500/10", label: "Offer" },
  deadline: { icon: AlertTriangle, color: "text-red-400", bgColor: "bg-red-500/10", label: "Deadline" },
  ai_insight: { icon: Sparkles, color: "text-cyan-400", bgColor: "bg-cyan-500/10", label: "AI Insight" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-blue-500",
};

/* ─────────────── Helpers ─────────────── */

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getActionLabel(entityType: string | null): string {
  switch (entityType) {
    case "application":
      return "Open Application";
    case "interview":
      return "Open Interview";
    case "offer":
      return "Open Offer";
    default:
      return "Open";
  }
}

/* ─────────────── Main Page ─────────────── */

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (cursor?: string, type?: string, append = false) => {
      if (!cursor) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params: Record<string, string> = { limit: "20" };
        if (cursor) params.cursor = cursor;
        if (type === "unread") {
          params.unreadOnly = "true";
        } else if (type) {
          params.type = type;
        }

        const { data } = await apiClient.get("/notifications", { params });

        if (append) {
          setNotifications((prev) => [...prev, ...(data.data || [])]);
        } else {
          setNotifications(data.data || []);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
      } catch (err: any) {
        if (err?.response?.status === 401) router.push("/login");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [router]
  );

  // Load on filter change
  useEffect(() => {
    fetchNotifications(undefined, activeFilter, false);
  }, [activeFilter, fetchNotifications]);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && nextCursor && !isLoadingMore) {
          fetchNotifications(nextCursor, activeFilter, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, isLoadingMore, activeFilter, fetchNotifications]);

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  // Mark as unread
  const markAsUnread = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch {}
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Clear read notifications
  const clearReadNotifications = async () => {
    try {
      await apiClient.delete("/notifications/read");
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch {}
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Count unread in current list
  const hasUnread = notifications.some((n) => !n.read);
  const hasRead = notifications.some((n) => n.read);

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge variant="error" dot>
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                What requires your attention right now
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4" />
                  Mark All Read
                </Button>
              )}
              {hasRead && (
                <Button variant="ghost" size="sm" onClick={clearReadNotifications}>
                  <Trash2 className="h-4 w-4" />
                  Clear Read
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-[var(--transition-fast)] whitespace-nowrap cursor-pointer",
                  activeFilter === filter.value
                    ? "bg-[var(--accent-primary)] text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title={
                  activeFilter === "unread"
                    ? "No unread notifications"
                    : activeFilter
                    ? `No ${TYPE_FILTERS.find((f) => f.value === activeFilter)?.label.toLowerCase()} notifications`
                    : "No notifications yet"
                }
                description={
                  activeFilter === "unread"
                    ? "You're all caught up! New notifications will appear here."
                    : activeFilter
                    ? "Try selecting a different filter or check back later."
                    : "Notifications about interviews, applications, and deadlines will appear here."
                }
              />
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, index) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    index={index}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkUnread={() => markAsUnread(notification._id)}
                    onDelete={async () => {
                      try {
                        await apiClient.delete(`/notifications/${notification._id}`);
                        setNotifications((prev) =>
                          prev.filter((n) => n._id !== notification._id)
                        );
                        if (!notification.read) {
                          setUnreadCount((prev) => Math.max(0, prev - 1));
                        }
                      } catch {}
                    }}
                  />
                ))}
              </AnimatePresence>

              {/* Load More sentinel */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-6">
                  {isLoadingMore && (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}

/* ─────────────── Notification Card ─────────────── */

function NotificationCard({
  notification,
  index,
  onClick,
  onMarkUnread,
  onDelete,
}: {
  notification: Notification;
  index: number;
  onClick: () => void;
  onMarkUnread: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.application;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <div
        className={cn(
          "group relative bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 cursor-pointer transition-all duration-[var(--transition-fast)]",
          "border-l-[3px]",
          PRIORITY_COLORS[notification.priority] || "border-l-amber-500",
          notification.read
            ? "opacity-70 hover:opacity-100"
            : "bg-[var(--bg-card)] shadow-[0_0_0_1px_rgba(59,130,246,0.05)]",
          "hover:bg-[var(--bg-card-hover)] hover:border-[#3F3F46]",
          notification.priority === "offer" && "ring-1 ring-emerald-500/20"
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`${notification.read ? "" : "Unread: "}${notification.title}`}
      >
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "text-sm font-semibold text-[var(--text-primary)] leading-snug",
                    !notification.read && "font-bold"
                  )}
                >
                  {notification.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {notification.description}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-[var(--text-muted)]">
                {formatRelativeTime(notification.createdAt)}
              </span>
              <Badge
                variant={
                  notification.type === "offer"
                    ? "success"
                    : notification.type === "interview"
                    ? "purple"
                    : notification.type === "deadline"
                    ? "error"
                    : notification.type === "ai_insight"
                    ? "info"
                    : notification.type === "follow_up"
                    ? "warning"
                    : "default"
                }
                className="text-[10px]"
              >
                {config.label}
              </Badge>
              {notification.relatedEntityType && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  {getActionLabel(notification.relatedEntityType)}
                </span>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
              aria-label="Notification actions"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg z-10 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {notification.relatedEntityType && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onClick();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {getActionLabel(notification.relatedEntityType)}
                      </button>
                    )}
                    {notification.read ? (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onMarkUnread();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Mark as Unread
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onClick();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Mark as Read
                      </button>
                    )}
                    <div className="border-t border-[var(--border-default)] my-1" />
                    <button
                      onClick={() => {
                        setShowActions(false);
                        onDelete();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}