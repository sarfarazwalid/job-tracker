"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  FileText,
  Sparkles,
  LogOut,
  Plus,
} from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    setOpen(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  return (
    <>
      {/* Trigger button - hidden, activated by Ctrl+K */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-[560px] px-4"
          >
            <Command
              className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-[var(--shadow-lg)]"
              loop
            >
              <div className="flex items-center border-b border-[var(--border-default)] px-4">
                <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                <Command.Input
                  placeholder="Search commands, pages, actions..."
                  className="flex-1 h-12 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none ml-3"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-medium text-[var(--text-muted)] px-2 py-1.5">
                  <Command.Item
                    onSelect={() => navigate("/applications")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => navigate("/applications")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <FileText className="h-4 w-4" />
                    Applications
                  </Command.Item>
                  <Command.Item
                    onSelect={() => navigate("/ai/insights")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI Insights
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="h-px bg-[var(--border-default)] my-1" />

                <Command.Group heading="Actions" className="text-xs font-medium text-[var(--text-muted)] px-2 py-1.5">
                  <Command.Item
                    onSelect={() => navigate("/applications?create=true")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)]"
                  >
                    <Plus className="h-4 w-4" />
                    New Application
                  </Command.Item>
                  <Command.Item
                    onSelect={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)] hover:text-red-400 data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-2.5">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-[10px]">↑↓</kbd>
                  <span>Navigate</span>
                  <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-[10px]">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <span>Powered by</span>
                  <span className="font-medium text-[var(--text-secondary)]">cmdk</span>
                </div>
              </div>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}