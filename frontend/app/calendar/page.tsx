"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Phone,
  Building2,
  Briefcase,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, RevealOnScroll } from "../components/motion-provider";
import { Button, Badge, Card, EmptyState } from "../components/ui";
import { cn } from "../lib/utils";

interface InterviewEvent {
  _id: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string;
  interviewType: string;
  duration: number;
  location: string;
  notes: string;
  status: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  phone: { label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  video: { label: "Video", icon: <Video className="h-3.5 w-3.5" /> },
  onsite: { label: "On-site", icon: <Building2 className="h-3.5 w-3.5" /> },
  technical: { label: "Technical", icon: <Clock className="h-3.5 w-3.5" /> },
  behavioral: { label: "Behavioral", icon: <Clock className="h-3.5 w-3.5" /> },
  final: { label: "Final", icon: <Briefcase className="h-3.5 w-3.5" /> },
  other: { label: "Other", icon: <CalendarIcon className="h-3.5 w-3.5" /> },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchInterviews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/interviews/upcoming", { params: { days: "90" } });
      setInterviews(data.data || []);
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return interviews.filter((iv) => {
      const ivDate = new Date(iv.interviewDate);
      const ivDateStr = `${ivDate.getFullYear()}-${String(ivDate.getMonth() + 1).padStart(2, "0")}-${String(ivDate.getDate()).padStart(2, "0")}`;
      return ivDateStr === dateStr;
    });
  };

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const selectedEvents = selectedDate
    ? interviews.filter((iv) => {
        const ivDate = new Date(iv.interviewDate);
        const ivDateStr = `${ivDate.getFullYear()}-${String(ivDate.getMonth() + 1).padStart(2, "0")}-${String(ivDate.getDate()).padStart(2, "0")}`;
        return ivDateStr === selectedDate;
      })
    : [];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await apiClient.put(`/interviews/${id}`, { status: "completed" });
      setInterviews((prev) =>
        prev.map((iv) => (iv._id === id ? { ...iv, status: "completed" } : iv))
      );
    } catch (err) {
      console.error("Failed to update interview", err);
    }
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calendar</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                View and manage your interview schedule
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">
                <CalendarIcon className="h-3 w-3" />
                {interviews.length} upcoming
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Calendar Grid */}
            <RevealOnScroll>
              <Card padding="lg">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevMonth}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {MONTHS[month]} {year}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-px bg-[var(--border-subtle)] rounded-lg overflow-hidden">
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-[var(--bg-card)] h-24 p-1" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const events = getEventsForDate(day);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                        className={cn(
                          "bg-[var(--bg-surface)] h-24 p-1.5 text-left transition-colors hover:bg-[var(--bg-card-hover)] relative group cursor-pointer",
                          isSelected && "ring-2 ring-[var(--accent-primary)] ring-inset",
                          isToday && "bg-[var(--accent-primary)]/5"
                        )}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium",
                          isToday ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-secondary)]"
                        )}>
                          {day}
                        </span>
                        {events.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {events.slice(0, 2).map((ev) => (
                              <div
                                key={ev._id}
                                className="flex items-center gap-1 px-1 py-0.5 rounded bg-purple-500/20"
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                                <span className="text-[9px] text-purple-300 truncate leading-tight">
                                  {ev.companyName}
                                </span>
                              </div>
                            ))}
                            {events.length > 2 && (
                              <span className="text-[9px] text-[var(--text-muted)] pl-1">
                                +{events.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </RevealOnScroll>

            {/* Events Panel */}
            <div className="space-y-4">
              {selectedDate ? (
                <RevealOnScroll>
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {selectedEvents.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <CalendarIcon className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                        <p className="text-sm text-[var(--text-muted)]">No interviews scheduled</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">This day is all clear</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvents.map((ev) => {
                          const typeConfig = TYPE_CONFIG[ev.interviewType] || TYPE_CONFIG.other;
                          return (
                            <div
                              key={ev._id}
                              className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                                    {ev.jobTitle}
                                  </h4>
                                  <p className="text-xs text-[var(--text-secondary)]">{ev.companyName}</p>
                                </div>
                                <Badge variant={ev.status === "completed" ? "success" : "purple"}>
                                  {typeConfig.icon}
                                  {typeConfig.label}
                                </Badge>
                              </div>

                              <div className="space-y-1.5 mt-2">
                                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTime(ev.interviewDate)} · {ev.duration} min
                                  </span>
                                </div>
                                {ev.location && (
                                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{ev.location}</span>
                                  </div>
                                )}
                              </div>

                              {ev.status === "scheduled" && (
                                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                                  <button
                                    onClick={() => handleMarkCompleted(ev._id)}
                                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Mark as completed
                                  </button>
                                </div>
                              )}
                              {ev.status === "completed" && (
                                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Completed
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </RevealOnScroll>
              ) : (
                <RevealOnScroll>
                  <Card>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Upcoming Interviews</h3>
                    {interviews.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <CalendarIcon className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                        <p className="text-sm text-[var(--text-muted)]">No upcoming interviews</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {interviews.slice(0, 10).map((ev) => {
                          const typeConfig = TYPE_CONFIG[ev.interviewType] || TYPE_CONFIG.other;
                          const ivDate = new Date(ev.interviewDate);
                          return (
                            <button
                              key={ev._id}
                              onClick={() => {
                                const ds = `${ivDate.getFullYear()}-${String(ivDate.getMonth() + 1).padStart(2, "0")}-${String(ivDate.getDate()).padStart(2, "0")}`;
                                setSelectedDate(ds);
                              }}
                              className="w-full text-left p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] transition-colors group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[var(--accent-primary)]">
                                  {ivDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                <Badge variant={ev.status === "completed" ? "success" : "purple"}>
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {ev.jobTitle}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">{ev.companyName}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(ev.interviewDate)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </RevealOnScroll>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </Sidebar>
  );
}