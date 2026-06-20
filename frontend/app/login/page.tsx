"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import apiClient from "../lib/api";
import { Button, Input } from "../components/ui";
import { Logo } from "../components/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", { username: email, password });
      localStorage.setItem("access_token", response.data.accessToken);
      localStorage.setItem("refresh_token", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      router.push("/applications");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.request) {
        setError("Unable to reach the server. Please try again later.");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] flex items-center justify-center px-4 noise-bg">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-[400px] relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">Sign in to your JobTracker account</p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 shadow-[var(--shadow-lg)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-8 w-4" /> : <Eye className="h-8 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              {!isLoading && <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium transition-colors"
          >
            Create one
          </Link>
        </p>

      </motion.div>
    </div>
  );
}