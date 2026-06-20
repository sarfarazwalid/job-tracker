"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  BarChart3,
  Mail,
  MessageCircle,
  BookOpen,
  TrendingUp,
  X,
  Copy,
  Check,
  Zap,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import apiClient from "../../lib/api";
import Sidebar from "../../components/sidebar";
import { PageTransition, RevealOnScroll } from "../../components/motion-provider";
import { Button, Input, Textarea, Select, Card, Badge, Skeleton } from "../../components/ui";
import { cn } from "../../lib/utils";

type Tab = "resume-match" | "job-fit" | "cover-letter" | "interview-questions" | "job-summary" | "career-insights";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "resume-match", label: "Resume Match", icon: <FileText className="h-4 w-4" /> },
  { key: "job-fit", label: "Job Fit", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "cover-letter", label: "Cover Letter", icon: <Mail className="h-4 w-4" /> },
  { key: "interview-questions", label: "Interview Prep", icon: <MessageCircle className="h-4 w-4" /> },
  { key: "job-summary", label: "Job Summary", icon: <BookOpen className="h-4 w-4" /> },
  { key: "career-insights", label: "Career Insights", icon: <TrendingUp className="h-4 w-4" /> },
];

export default function AIInsightsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("resume-match");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Form states
  const [resumeMatchForm, setResumeMatchForm] = useState({ resume: "", jobDescription: "" });
  const [jobFitForm, setJobFitForm] = useState({ jobDetails: "" });
  const [coverLetterForm, setCoverLetterForm] = useState({ jobDetails: "", additionalContext: "" });
  const [interviewForm, setInterviewForm] = useState({ jobTitle: "", company: "", roleLevel: "Mid-level" });
  const [jobSummaryForm, setJobSummaryForm] = useState({ jobDescription: "" });

  const checkAuth = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!checkAuth()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;
      switch (activeTab) {
        case "resume-match":
          response = await apiClient.post("/ai/resume-match", resumeMatchForm);
          break;
        case "job-fit":
          response = await apiClient.post("/ai/job-fit", jobFitForm);
          break;
        case "cover-letter":
          response = await apiClient.post("/ai/cover-letter", coverLetterForm);
          break;
        case "interview-questions":
          response = await apiClient.post("/ai/interview-questions", interviewForm);
          break;
        case "job-summary":
          response = await apiClient.post("/ai/job-summary", jobSummaryForm);
          break;
        case "career-insights":
          response = await apiClient.get("/ai/career-insights");
          break;
      }
      setResult(response?.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Insights</h1>
              <Badge variant="purple">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Leverage AI to optimize your job search strategy
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setResult(null);
                  setError("");
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-[var(--accent-primary)] text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-[#3F3F46]"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Card */}
          <RevealOnScroll>
            <Card className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "resume-match" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        Resume Match Analyzer
                      </h3>
                      <div className="space-y-4">
                        <Textarea
                          label="Your Resume"
                          rows={6}
                          placeholder="Paste your resume text here..."
                          value={resumeMatchForm.resume}
                          onChange={(e) => setResumeMatchForm({ ...resumeMatchForm, resume: e.target.value })}
                        />
                        <Textarea
                          label="Job Description"
                          rows={6}
                          placeholder="Paste the job description here..."
                          value={resumeMatchForm.jobDescription}
                          onChange={(e) => setResumeMatchForm({ ...resumeMatchForm, jobDescription: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "job-fit" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        Job Fit Scoring
                      </h3>
                      <Textarea
                        label="Job Details"
                        rows={8}
                        placeholder="Paste the job description and requirements..."
                        value={jobFitForm.jobDetails}
                        onChange={(e) => setJobFitForm({ ...jobFitForm, jobDetails: e.target.value })}
                      />
                    </div>
                  )}

                  {activeTab === "cover-letter" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-400" />
                        Cover Letter Generator
                      </h3>
                      <div className="space-y-4">
                        <Textarea
                          label="Job Details"
                          rows={6}
                          placeholder="Paste the job description..."
                          value={coverLetterForm.jobDetails}
                          onChange={(e) => setCoverLetterForm({ ...coverLetterForm, jobDetails: e.target.value })}
                        />
                        <Textarea
                          label="Additional Context (optional)"
                          rows={3}
                          placeholder="Any specific points you want to highlight..."
                          value={coverLetterForm.additionalContext}
                          onChange={(e) => setCoverLetterForm({ ...coverLetterForm, additionalContext: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "interview-questions" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-amber-400" />
                        Interview Question Generator
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="Job Title"
                          placeholder="e.g. Senior Frontend Developer"
                          value={interviewForm.jobTitle}
                          onChange={(e) => setInterviewForm({ ...interviewForm, jobTitle: e.target.value })}
                        />
                        <Input
                          label="Company"
                          placeholder="e.g. Google"
                          value={interviewForm.company}
                          onChange={(e) => setInterviewForm({ ...interviewForm, company: e.target.value })}
                        />
                        <Select
                          label="Level"
                          options={[
                            { value: "Junior", label: "Junior" },
                            { value: "Mid-level", label: "Mid-level" },
                            { value: "Senior", label: "Senior" },
                            { value: "Lead", label: "Lead" },
                            { value: "Manager", label: "Manager" },
                          ]}
                          value={interviewForm.roleLevel}
                          onChange={(val) => setInterviewForm({ ...interviewForm, roleLevel: val })}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "job-summary" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-cyan-400" />
                        Job Summary + Skill Gap Analysis
                      </h3>
                      <Textarea
                        label="Job Description"
                        rows={8}
                        placeholder="Paste the full job description..."
                        value={jobSummaryForm.jobDescription}
                        onChange={(e) => setJobSummaryForm({ ...jobSummaryForm, jobDescription: e.target.value })}
                      />
                    </div>
                  )}

                  {activeTab === "career-insights" && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-rose-400" />
                        Career Insights Dashboard
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Analyze all your applications and get strategic AI-powered insights. No input needed — just click Analyze.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSubmit} loading={loading} size="lg">
                  {!loading && (
                    <>
                      <Zap className="h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </RevealOnScroll>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <RevealOnScroll>
              <Card className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-[var(--accent-primary)] animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Running AI analysis...</p>
                    <p className="text-xs text-[var(--text-muted)]">This may take a few moments</p>
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </Card>
            </RevealOnScroll>
          )}

          {/* Results */}
          {result && !loading && (
            <RevealOnScroll>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Results</h3>
                </div>

                {/* Resume Match */}
                {activeTab === "resume-match" && result.matchScore !== undefined && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-400">{result.matchScore}%</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Match Score</p>
                        <p className="text-xs text-[var(--text-muted)]">How well your resume matches this job</p>
                      </div>
                    </div>
                    {result.matchingSkills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">Matching Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.matchingSkills.map((s: string, i: number) => (
                            <Badge key={i} variant="success">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.missingSkills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.missingSkills.map((s: string, i: number) => (
                            <Badge key={i} variant="error">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.recommendation && (
                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <h4 className="text-xs font-medium text-blue-400 mb-1">Recommendation</h4>
                        <p className="text-sm text-[var(--text-secondary)]">{result.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Job Fit */}
                {activeTab === "job-fit" && result.score !== undefined && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-400">{result.score}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Fit Score / 100</p>
                        <p className="text-xs text-[var(--text-muted)]">Overall compatibility rating</p>
                      </div>
                    </div>
                    {result.breakdown && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(result.breakdown).map(([key, val]: [string, any]) => (
                          <div key={key} className="text-center p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                            <div className="text-lg font-semibold text-[var(--text-primary)]">{val}%</div>
                            <div className="text-xs text-[var(--text-muted)] capitalize mt-0.5">{key.replace("Match", "")}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.insights && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.insights}</p>}
                    {result.suggestions?.length > 0 && (
                      <div className="space-y-2">
                        {result.suggestions.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <ArrowRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cover Letter */}
                {activeTab === "cover-letter" && result.coverLetter && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{result.wordCount} words</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(result.coverLetter)}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed">
                      {result.coverLetter}
                    </div>
                  </div>
                )}

                {/* Interview Questions */}
                {activeTab === "interview-questions" && result.questions && (
                  <div className="space-y-3">
                    {result.questions.map((q: any, i: number) => (
                      <div key={i} className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="info">{q.category}</Badge>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{q.question}</p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.suggestedAnswer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Job Summary */}
                {activeTab === "job-summary" && result.summary && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Summary</h4>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
                    </div>
                    {result.keyRequirements?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Key Requirements</h4>
                        <div className="space-y-1.5">
                          {result.keyRequirements.map((r: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.skillGaps?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Skill Gaps</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.skillGaps.map((s: string, i: number) => (
                            <Badge key={i} variant="error">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.suggestedLearning?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Suggested Learning</h4>
                        <div className="space-y-2">
                          {result.suggestedLearning.map((l: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                              <Badge variant={l.priority === "high" ? "error" : l.priority === "medium" ? "warning" : "default"}>
                                {l.priority}
                              </Badge>
                              <span className="font-medium text-[var(--text-primary)]">{l.skill}</span>
                              <span className="text-[var(--text-muted)]">— {l.resource}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Career Insights */}
                {activeTab === "career-insights" && result.applicationStats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{result.applicationStats.total}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">Applications</div>
                      </div>
                      <div className="text-center p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{result.successRate}%</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{result.applicationStats.averageStatusProgress}%</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">Avg Progress</div>
                      </div>
                    </div>
                    {result.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Recommendations</h4>
                        <div className="space-y-2">
                          {result.recommendations.map((r: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback */}
                {result && !result.matchScore && !result.score && !result.coverLetter && !result.questions && !result.summary && !result.applicationStats && (
                  <pre className="text-xs bg-[var(--bg-elevated)] p-4 rounded-lg overflow-auto border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </Card>
            </RevealOnScroll>
          )}
        </div>
      </PageTransition>
    </Sidebar>
  );
}