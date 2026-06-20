"use client";

import { type ReactNode, useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "sonner";
import AIChatWidget from "./AIChatWidget";

interface AuthContextValue {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("access_token"));
    };
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener("auth-change", handleAuthChange);

    // Monkey-patch localStorage to dispatch auth-change
    const origSetItem = localStorage.setItem.bind(localStorage);
    const origRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = function (key, value) {
      origSetItem(key, value);
      if (key === "access_token") {
        window.dispatchEvent(new CustomEvent("auth-change"));
      }
    };

    localStorage.removeItem = function (key) {
      origRemoveItem(key);
      if (key === "access_token") {
        window.dispatchEvent(new CustomEvent("auth-change"));
      }
    };

    return () => {
      localStorage.setItem = origSetItem;
      localStorage.removeItem = origRemoveItem;
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
      <AIChatWidget />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            fontSize: "13px",
            borderRadius: "var(--radius-lg)",
          },
          className: "mono-number",
        }}
      />
    </AuthContext.Provider>
  );
}
