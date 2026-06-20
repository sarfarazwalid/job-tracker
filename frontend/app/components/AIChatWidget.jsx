"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  User,
  MessageCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import apiClient from "../lib/api";
import { MagneticButton } from "./magnetic-button";
import { useAuth } from "./providers";

/* ─────────── Types (JSDoc) ─────────── */

/**
 * @typedef {{ role: 'user' | 'assistant', content: string, timestamp?: string }} Message
 */

/* ─────────── Greeting message ─────────── */

const GREETING_MESSAGE = {
  role: "assistant",
  content:
    "Hi there! 👋 I'm your **Personal Career Assistant**. I can help you with:\n\n• Resume writing tips\n• Interview preparation\n• Job search strategies\n• Career advice\n• Cover letter guidance\n\nHow can I help you today?",
};

/* ─────────── Markdown renderer ─────────── */

const MarkdownContent = memo(function MarkdownContent({ content }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-0.5 text-left">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-0.5 text-left">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text-primary)]">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[var(--text-secondary)]">{children}</em>
        ),
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--accent-primary)] text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <code
              className={`${className || ""} block p-3 rounded-lg bg-[var(--bg-root)] text-[var(--text-primary)] text-xs font-mono overflow-x-auto my-2`}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-[var(--bg-root)] rounded-lg p-3 overflow-x-auto my-2 border border-[var(--border-default)]">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] hover:underline"
          >
            {children}
          </a>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-semibold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--accent-primary)] pl-3 my-2 text-[var(--text-secondary)] italic">
            {children}
          </blockquote>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

/* ─────────── Typing indicator (amber) ─────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

/* ─────────── Chat message bubble ─────────── */

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[85%]`}
      >
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            isUser
              ? "bg-[var(--accent-glow)]"
              : "bg-gradient-to-br from-[var(--accent-primary)]/30 to-amber-600/10"
          }`}
        >
          {isUser ? (
            <User className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          ) : (
            <img src="/chat-bot.gif" alt="AI Assistant" className="w-6 h-6 rounded-full object-cover" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm ${
            isUser
              ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] rounded-br-md"
              : "bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────── Main Chat Widget ─────────── */

function AIChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const tooltipTimerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([GREETING_MESSAGE]);
      setHasInteracted(true);
    }
  }, [isOpen, messages.length]);

  // Tooltip logic
  useEffect(() => {
    if (isOpen || hasInteracted) return;

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
        tooltipTimerRef.current = setInterval(() => {
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 4000);
        }, 5000);
      }, 4000);
      return () => clearTimeout(hideTimer);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      if (tooltipTimerRef.current) clearInterval(tooltipTimerRef.current);
    };
  }, [isOpen, hasInteracted]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const conversationHistory = updatedMessages
        .filter((m) => m !== GREETING_MESSAGE)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await apiClient.post("/ai/chat", {
        message: text,
        conversation: conversationHistory.slice(0, -1),
      });

      const aiMessage = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const detail =
        error?.response?.data?.detail || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${detail}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback((e) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowTooltip(false);
    if (tooltipTimerRef.current) {
      clearInterval(tooltipTimerRef.current);
    }
  }, []);

  // Expose global open trigger for modal CTA
  useEffect(() => {
    const openFromModal = () => handleOpen();
    window.addEventListener("open-chat", openFromModal);
    return () => window.removeEventListener("open-chat", openFromModal);
  }, [handleOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ── Expanded Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-24 right-6 z-[9998] w-[380px] h-[560px] sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[560px] flex flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(22,25,29,0.95)] backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
            style={{ transformOrigin: "bottom right" }}
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 h-14 shrink-0 bg-white/[0.02] border-b border-white/[0.08]">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/chat-bot.gif" alt="AI Assistant" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                  Personal Career Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleClose(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0 bg-transparent">
                {messages.length <= 1 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      "How to ace my next interview?",
                      "Resume tips for tech roles",
                      "How to negotiate salary?",
                      "Best job search strategies",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInputValue(suggestion);
                          setTimeout(() => handleSend(), 50);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/30 transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        <img src="/chat-bot.gif" alt="AI Assistant" className="w-full h-full object-cover" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Area ── */}
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.08] bg-transparent">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-[var(--accent-primary)]/50 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your job search..."
                    rows={1}
                    disabled={isLoading}
                    className={`flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none max-h-[120px] disabled:opacity-50 leading-relaxed ${inputValue.trim() ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
                  />
                    <MagneticButton maxShift={6}>
                      <motion.button
                        whileHover={{ scale: inputValue.trim() && !isLoading ? 1.05 : 1 }}
                        whileTap={{ scale: inputValue.trim() && !isLoading ? 0.95 : 1 }}
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </motion.button>
                    </MagneticButton>
                </div>
                <p className="text-[9px] text-[var(--text-muted)] mt-1.5 text-center">
                  AI can make mistakes. Consider verifying important information.
                </p>
              </div>
            </>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button + Tooltip ── */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8, y: 4 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -8, y: 4 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-full mb-3 right-0 whitespace-nowrap glass-card px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-secondary)]">
                  I am here, for your assistance!
                </span>
              </div>
              <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-[#16191D] border-r border-b border-white/[0.08] rotate-45 backdrop-blur-sm" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isOpen ? handleClose : handleOpen}
          className="relative w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #FFB020, #E89E1A)",
            boxShadow: isOpen
              ? "0 4px 20px rgba(255, 176, 32, 0.3)"
              : "0 4px 20px rgba(255, 176, 32, 0.25), 0 0 40px rgba(255, 176, 32, 0.15)",
          }}
        >
          {!isOpen && !hasInteracted && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid rgba(255, 176, 32, 0.35)" }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 text-[var(--text-inverse)]" />
              </motion.div>
            ) : (
              <motion.div
                key="sparkle"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <img src="/chat-bot.gif" alt="AI Assistant" className="w-8 h-8 rounded-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

export default memo(AIChatWidget);