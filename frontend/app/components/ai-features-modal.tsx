"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, MessageCircle, BarChart3, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui";

interface AIFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIFeaturesModal({ isOpen, onClose }: AIFeaturesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#16191D] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto border border-white/[0.08]">
              {/* Header */}
              <div className="sticky top-0 bg-[#16191D]/90 backdrop-blur-lg border-b border-white/[0.08] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">AI-Powered Features</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">Supercharge your job search with intelligent tools</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
                >
                  <X className="h-5 w-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Feature 1: Resume Analyzer */}
                <div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-[#16191D] border border-[var(--accent-primary)]/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-[var(--text-inverse)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">AI Resume Analyzer</h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">Know your chances before you apply.</p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                    Paste your resume and a job description to instantly receive:
                  </p>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
                      Match Score with compatibility rating
                    </li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
                      Matching Skills identification
                    </li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
                      Missing Skills analysis
                    </li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
                      AI Compatibility Analysis
                    </li>
                  </ul>

                  {/* Example Score Card */}
                  <div className="bg-[#0D0F12] rounded-xl p-4 shadow-md border border-white/[0.08] max-w-xs">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[var(--accent-primary)] mb-1 mono-number">86%</div>
                      <div className="text-xs font-semibold text-[var(--status-success)] mb-3">Strong Match</div>
                      <div className="space-y-1.5 text-left">
                        <div>
                          <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Matching Skills</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-[var(--status-success)]/10 text-[var(--status-success)] text-xs rounded-full border border-[var(--status-success)]/20">React</span>
                            <span className="px-2 py-0.5 bg-[var(--status-success)]/10 text-[var(--status-success)] text-xs rounded-full border border-[var(--status-success)]/20">Node.js</span>
                            <span className="px-2 py-0.5 bg-[var(--status-success)]/10 text-[var(--status-success)] text-xs rounded-full border border-[var(--status-success)]/20">MongoDB</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Missing Skills</div>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs rounded-full border border-[var(--status-error)]/20 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Docker
                            </span>
                            <span className="px-2 py-0.5 bg-[var(--status-error)]/10 text-[var(--status-error)] text-xs rounded-full border border-[var(--status-error)]/20 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              AWS
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href="/login" onClick={onClose}>
                      <Button size="lg" className="w-full sm:w-auto">
                        Try Resume Analyzer
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Career Assistant Preview */}
                <div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-[#16191D] border border-[var(--accent-primary)]/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <MessageCircle className="h-6 w-6 text-[var(--text-inverse)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">AI Career Assistant</h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">Always available when you need help.</p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                    Ask questions about resumes, interviews, career planning, and job search strategies — the assistant is available from every page.
                  </p>

                  {/* Chat Preview */}
                  <div className="bg-[#0D0F12] rounded-xl p-4 border border-white/[0.08] max-w-sm">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="h-3 w-3 text-[var(--text-inverse)]" />
                        </div>
                        <div className="bg-white/[0.06] px-3 py-2 rounded-2xl rounded-tl-sm border border-white/[0.08]">
                          <p className="text-xs text-[var(--text-primary)]">Hi! How can I help with your job search today?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 flex-row-reverse">
                        <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-medium text-[var(--text-primary)]">You</span>
                        </div>
                        <div className="bg-[var(--accent-primary)] px-3 py-2 rounded-2xl rounded-tr-sm">
                          <p className="text-xs text-[var(--text-inverse)]">Can you review my resume for a React position?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Apply Smarter</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Understand your compatibility before applying.</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="text-2xl mb-2">⚡</div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Save Time</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Avoid applying to poor-fit opportunities.</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <div className="text-2xl mb-2">📈</div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Improve Faster</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Identify skill gaps and strengthen future applications.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}