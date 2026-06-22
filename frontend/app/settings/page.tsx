"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Lock,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import apiClient from "../lib/api";
import Sidebar from "../components/sidebar";
import { PageTransition, RevealOnScroll } from "../components/motion-provider";
import { Button, Input, Textarea, Card, Divider, Skeleton, ModalOverlay } from "../components/ui";
import { cn } from "../lib/utils";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    resumeText: string;
    skills: string[];
    experience: string;
    education: string;
    location: string;
    linkedIn: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile form
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    location: "",
    linkedIn: "",
    resumeText: "",
    skills: "",
    experience: "",
    education: "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/auth/me");
      const u = data.user;
      setUser(u);
      setProfile({
        firstName: u.profile?.firstName || "",
        lastName: u.profile?.lastName || "",
        location: u.profile?.location || "",
        linkedIn: u.profile?.linkedIn || "",
        resumeText: u.profile?.resumeText || "",
        skills: (u.profile?.skills || []).join(", "),
        experience: u.profile?.experience || "",
        education: u.profile?.education || "",
      });
    } catch (err: any) {
      if (err?.response?.status === 401) router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const skillsArr = profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await apiClient.put("/auth/me", {
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          location: profile.location,
          linkedIn: profile.linkedIn,
          resumeText: profile.resumeText,
          skills: skillsArr,
          experience: profile.experience,
          education: profile.education,
        },
      });

      // Update local user data
      if (user) {
        const updated = { ...user, profile: { ...user.profile, ...profile, skills: skillsArr } };
        localStorage.setItem("user", JSON.stringify(updated));
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.detail || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setChangingPassword(true);
    setMessage(null);
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.detail || "Failed to change password." });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await apiClient.delete("/auth/me");
      // Clear all auth data
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      // Redirect to landing page
      window.location.href = "/";
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.detail || "Failed to delete account." });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="p-6 lg:p-8 max-w-[800px] mx-auto">
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-[800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "mb-6 p-4 rounded-lg border text-sm flex items-center gap-3",
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              )}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1">{message.text}</span>
              <button onClick={() => setMessage(null)} className="hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Profile Section */}
          <RevealOnScroll>
            <Card hover={false} className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Profile</h2>
                  <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="Your first name"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Your last name"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Location"
                    placeholder="e.g. San Francisco, CA"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                  <Input
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/in/..."
                    value={profile.linkedIn}
                    onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
                  />
                </div>

                <Input
                  label="Skills (comma separated)"
                  placeholder="e.g. JavaScript, React, Python"
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                />

                <Textarea
                  label="Experience"
                  placeholder="Describe your professional experience..."
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  rows={4}
                />

                <Textarea
                  label="Education"
                  placeholder="Your educational background..."
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  rows={3}
                />

                <Textarea
                  label="Resume / Bio"
                  placeholder="Paste your resume or professional bio..."
                  value={profile.resumeText}
                  onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                  rows={5}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </RevealOnScroll>

          {/* Security Section */}
          <RevealOnScroll delay={0.1}>
            <Card hover={false}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Security</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Change your password</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type={showPasswords ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type={showPasswords ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                  <Input
                    label="Confirm Password"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--accent-primary)]"
                    />
                    Show passwords
                  </label>
                  <Button type="submit" variant="secondary" loading={changingPassword}>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </form>
            </Card>
          </RevealOnScroll>

          {/* Account Info */}
          <RevealOnScroll delay={0.15}>
            <Card hover={false} className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Account</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Account details and status</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)]">
                  <span className="text-sm text-[var(--text-secondary)]">Username</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)]">
                  <span className="text-sm text-[var(--text-secondary)]">Email</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)]">
                  <span className="text-sm text-[var(--text-secondary)]">Active</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">Yes</span>
                </div>
              </div>
            </Card>
          </RevealOnScroll>

          {/* Danger Zone */}
          <RevealOnScroll delay={0.2}>
            <Card hover={false} className="mt-6 border-red-500/20 bg-red-500/[0.03]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Delete Account</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
              Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteModal(true)}
                  className="!border-red-500/30 !text-red-400 hover:!bg-red-500/10 hover:!text-red-300"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </Card>
          </RevealOnScroll>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <ModalOverlay onClose={() => !deleting && setShowDeleteModal(false)}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Account</h3>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Are you sure you want to permanently delete your account?
                  </p>

                  <p className="text-sm text-[var(--text-secondary)]">
                    The following data will be removed:
                  </p>

                  <ul className="space-y-2">
                    {[
                      "Profile information",
                      "Job applications",
                      "Companies",
                      "Analytics",
                      "AI insights",
                      "Notifications",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm text-red-400 font-medium">
                    This action cannot be undone.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      loading={deleting}
                      className="!bg-red-500 hover:!bg-red-600 text-white border-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </ModalOverlay>
            )}
          </AnimatePresence>
        </div>
      </PageTransition>
    </Sidebar>
  );
}