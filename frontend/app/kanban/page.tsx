"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Loader2,
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition } from "../components/motion-provider";
import { Button, Badge, Card, EmptyState } from "../components/ui";
import { formatRelativeDate, cn } from "../lib/utils";

interface JobApplication {
  _id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  location: string;
  notes: string;
  aiFitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

const PIPELINE_STAGES = [
  { key: "Wishlist", label: "Wishlist", color: "border-l-zinc-500", bgColor: "bg-zinc-500/10" },
  { key: "Applied", label: "Applied", color: "border-l-blue-500", bgColor: "bg-blue-500/10" },
  { key: "Assessment", label: "Assessment", color: "border-l-amber-500", bgColor: "bg-amber-500/10" },
  { key: "Interview_Scheduled", label: "Interview", color: "border-l-purple-500", bgColor: "bg-purple-500/10" },
  { key: "Offer_Received", label: "Offer", color: "border-l-emerald-500", bgColor: "bg-emerald-500/10" },
  { key: "Rejected", label: "Rejected", color: "border-l-red-500", bgColor: "bg-red-500/10" },
];

const ALL_STATUSES = [
  "Wishlist", "Applied", "Assessment",
  "Interview_Scheduled", "Interview_Completed", "Offer_Received",
  "Accepted", "Rejected", "Withdrawn",
];

export default function KanbanPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());

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
      const { data } = await apiClient.get("/applications", { params: { limit: "200" } });
      setApplications(data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/applications/${id}`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getStageApps = (stageKey: string) => {
    return applications
      .filter((app) => app.status === stageKey)
      .filter((app) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          app.companyName.toLowerCase().includes(q) ||
          app.jobTitle.toLowerCase().includes(q)
        );
      });
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(stageKey);
  };

  const handleDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggingId) {
      await handleStatusChange(draggingId, stageKey);
    }
    setDraggingId(null);
  };

  const toggleCollapse = (stageKey: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageKey)) next.delete(stageKey);
      else next.add(stageKey);
      return next;
    });
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
        <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kanban Board</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Drag & drop applications through your pipeline vertically
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30 transition-all w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Pipeline Stats */}
          <div className="flex items-center gap-3 mb-6 text-xs text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">{applications.length} total</span>
            <span>·</span>
            <span>{applications.filter((a) => !["Rejected", "Withdrawn", "Accepted"].includes(a.status)).length} active</span>
            <span>·</span>
            <span>{applications.filter((a) => a.status === "Offer_Received" || a.status === "Accepted").length} offers</span>
          </div>

          {applications.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Briefcase className="h-6 w-6" />}
                title="No applications yet"
                description="Add your first application to see it on the Kanban board."
                action={
                  <Button onClick={() => router.push("/applications?create=true")}>
                    <Plus className="h-4 w-4" />
                    Add Application
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage) => {
                const stageApps = getStageApps(stage.key);
                const isOver = dragOverStage === stage.key;
                const isCollapsed = collapsedStages.has(stage.key);

                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => handleDragOver(e, stage.key)}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    onDragLeave={() => setDragOverStage(null)}
                  >
                    {/* Stage Header (always visible) */}
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] border-l-[3px] cursor-pointer select-none transition-colors hover:bg-[var(--bg-card-hover)]",
                        stage.color,
                        isOver && "ring-2 ring-[var(--accent-primary)] ring-inset"
                      )}
                      onClick={() => toggleCollapse(stage.key)}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{stage.label}</span>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          stage.bgColor,
                          "text-[var(--text-secondary)]"
                        )}>
                          {stageApps.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOver && (
                          <span className="text-[10px] text-[var(--accent-primary)] font-medium">Drop here</span>
                        )}
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>

                    {/* Stage Cards */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className={cn(
                            "ml-1 pl-4 border-l-2 border-[var(--border-subtle)] space-y-2 mt-2 mb-2",
                            isOver && "border-l-[var(--accent-primary)] border-dashed"
                          )}>
                            {stageApps.length === 0 ? (
                              <div className={cn(
                                "flex items-center justify-center h-16 rounded-lg text-xs text-[var(--text-muted)] border-2 border-dashed border-[var(--border-subtle)] transition-colors",
                                isOver && "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5"
                              )}>
                                Drop cards here
                              </div>
                            ) : (
                              <AnimatePresence mode="popLayout">
                                {stageApps.map((app) => (
                                  <motion.div
                                    key={app._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    draggable
                                    onDragStart={() => handleDragStart(app._id)}
                                    className={cn(
                                      "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3F3F46] transition-all group",
                                      draggingId === app._id ? "opacity-50 scale-95" : ""
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                            {app.jobTitle}
                                          </h4>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                          {app.companyName}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {app.aiFitScore && (
                                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            {app.aiFitScore}%
                                          </span>
                                        )}
                                        <select
                                          value={app.status}
                                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                          className="text-[10px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {ALL_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                                      {app.location && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {app.location}
                                        </span>
                                      )}
                                      <span>{formatRelativeDate(app.updatedAt || app.createdAt)}</span>
                                    </div>

                                    {app.notes && (
                                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5 line-clamp-1">
                                        {app.notes}
                                      </p>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}