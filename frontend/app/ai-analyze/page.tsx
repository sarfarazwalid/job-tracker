"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Upload,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition } from "../components/motion-provider";
import { Button, Card, Badge } from "../components/ui";
import { MagneticButton } from "../components/magnetic-button";

/* ─────────── Types ─────────── */

interface AnalysisResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
}

interface HistoryItem {
  _id: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
  createdAt: string;
  input?: { resumeLength?: number; jobDescriptionLength?: number };
}

/* ─────────── Score classification ─────────── */

function getScoreLabel(score: number): { label: string; color: string; ring: string } {
  if (score >= 90) return { label: "Excellent Match", color: "text-emerald-400", ring: "stroke-emerald-400" };
  if (score >= 75) return { label: "Strong Match", color: "text-green-400", ring: "stroke-green-400" };
  if (score >= 50) return { label: "Moderate Match", color: "text-amber-400", ring: "stroke-amber-400" };
  return { label: "Weak Match", color: "text-red-400", ring: "stroke-red-400" };
}

/* ─────────── Circular Progress ─────────── */

function CircularProgress({ score }: { score: number }) {
  const { label, color, ring } = getScoreLabel(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--bg-card)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-[var(--text-primary)]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {score}%
        </motion.span>
        <span className={`text-[10px] font-medium mt-0.5 ${color}`}>{label}</span>
      </div>
    </div>
  );
}

/* ─────────── Skill Chip ─────────── */

function SkillChip({ skill, matched }: { skill: string; matched: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        matched
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {matched ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {skill}
    </motion.span>
  );
}

/* ─────────── Main Page ─────────── */

export default function AIAnalyzePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── File upload ──
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(fileExtension || '')) {
      setError("Please upload a PDF or DOCX file only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    setError(null);

    // Upload file to backend for text extraction
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await apiClient.post("/upload/resume", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResumeText(response.data.text);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Unable to read this resume. Please upload a text-based PDF/DOCX file or paste your resume manually.";
      setError(detail);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── Analyze ──
  const handleAnalyze = useCallback(async () => {
    const trimmedResume = resumeText.trim();
    const trimmedJob = jobDescription.trim();

    if (!trimmedResume) {
      setError("Please enter your resume content.");
      return;
    }
    if (!trimmedJob) {
      setError("Please enter a job description.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await apiClient.post("/ai/analyze-resume", {
        resumeText: trimmedResume,
        jobDescription: trimmedJob,
      });

      setResult({
        matchScore: data.matchScore,
        matchingSkills: data.matchingSkills || [],
        missingSkills: data.missingSkills || [],
        summary: data.summary || "",
      });
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        setError(err?.response?.data?.detail || "Unable to analyze currently. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeText, jobDescription]);

  // ── Load history ──
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await apiClient.get("/ai/history", {
        params: { feature: "resume-analyze", limit: 10 },
      });
      setHistory(data.results || []);
    } catch {
      // silently fail
    }
    setLoadingHistory(false);
  }, []);

  const toggleHistory = useCallback(() => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  }, [showHistory, fetchHistory]);

  // ── Clear ──
  const handleClear = useCallback(() => {
    setResumeText("");
    setJobDescription("");
    setFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── Load history item into form ──
  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setResult({
      matchScore: item.matchScore,
      matchingSkills: item.matchingSkills,
      missingSkills: item.missingSkills,
      summary: item.summary,
    });
    setShowHistory(false);
  }, []);

  /* ─────────────── Render ─────────────── */

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Analyze</h1>
              <Badge variant="orange">
                <ScanSearch className="h-3 w-3" />
                Resume Match
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Paste or Upload your resume and a job description to see how well you match.
            </p>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400/60 hover:text-red-400 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── Input Section (3 cols) ── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Resume Input */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Resume
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* File upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3" />
                          Upload
                        </>
                      )}
                    </button>
                    {fileName && (
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[100px]">
                        {fileName}
                      </span>
                    )}
                  </div>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content here..."
                  rows={8}
                  className="w-full bg-[var(--bg-root)] border border-[var(--border-default)] rounded-lg px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                />
              </Card>

              {/* Job Description Input */}
              <Card>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  Job Description
                </h3>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description or requirements here..."
                  rows={8}
                  className="w-full bg-[var(--bg-root)] border border-[var(--border-default)] rounded-lg px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                />
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <MagneticButton maxShift={6}>
                  <Button
                    onClick={handleAnalyze}
                    loading={isAnalyzing}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing resume...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Match
                      </>
                    )}
                  </Button>
                </MagneticButton>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  onClick={toggleHistory}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  History
                </button>
              </div>

              {/* History panel */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Card>
                      <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        Recent Analyses
                      </h3>
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-4">
                          No previous analyses found.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => loadHistoryItem(item)}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] transition-colors text-left cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[var(--text-primary)]">
                                    Score: {item.matchScore}%
                                  </span>
                                  <span className={`text-[10px] font-medium ${getScoreLabel(item.matchScore).color}`}>
                                    {getScoreLabel(item.matchScore).label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Trash2 className="w-3 h-3 text-[var(--text-muted)] hover:text-red-400 shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Results Section (2 cols) ── */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Match Score Card */}
                    <Card glow className="text-center">
                      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                        Match Score
                      </h3>
                      <div className="flex justify-center mb-4">
                        <CircularProgress score={result.matchScore} />
                      </div>
                    </Card>

                    {/* Summary */}
                    <Card>
                      <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        Summary
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {result.summary}
                      </p>
                    </Card>

                    {/* Matching Skills */}
                    {result.matchingSkills.length > 0 && (
                      <Card>
                        <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Matching Skills
                          <span className="text-[10px] text-[var(--text-muted)] font-normal ml-auto">
                            {result.matchingSkills.length}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.matchingSkills.map((skill) => (
                            <SkillChip key={skill} skill={skill} matched />
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Missing Skills */}
                    {result.missingSkills.length > 0 && (
                      <Card>
                        <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                          Missing Skills
                          <span className="text-[10px] text-[var(--text-muted)] font-normal ml-auto">
                            {result.missingSkills.length}
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.missingSkills.map((skill) => (
                            <SkillChip key={skill} skill={skill} matched={false} />
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Re-analyze */}
                    <button
                      onClick={() => {
                        setResult(null);
                        handleAnalyze();
                      }}
                      disabled={isAnalyzing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-analyze
                    </button>
                  </motion.div>
                ) : isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card glow className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Analyzing resume...
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        AI is comparing your resume with the job requirements
                      </p>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="text-center py-12">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center mx-auto mb-4">
                        <ScanSearch className="w-6 h-6 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Ready to analyze
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[240px] mx-auto">
                        Upload your resume and paste a job description to begin.
                      </p>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </PageTransition>
    </Sidebar>
  );
}