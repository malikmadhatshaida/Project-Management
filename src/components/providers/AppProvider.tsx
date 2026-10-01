"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserSession {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    bio?: string | null;
    skills?: string | null;
    isSuperAdmin?: boolean;
  };
  membership: {
    id: string;
    companyId: string;
    roleName: string;
    roleDisplayName: string;
    department?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
    status: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    description?: string | null;
  };
  permissions: string[];
}

interface TimerState {
  isRunning: boolean;
  seconds: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
}

interface AppContextType {
  session: UserSession | null;
  setSession: (s: UserSession | null) => void;
  isLoading: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  timer: TimerState;
  startTimer: (projectId?: string, taskId?: string, notes?: string) => void;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  refreshSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    seconds: 0,
  });

  // Load theme and session on mount
  useEffect(() => {
    // 1. Theme
    const storedTheme = localStorage.getItem("pm_theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Fetch session
    fetchSession();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("pm_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const startTimer = (projectId?: string, taskId?: string, notes?: string) => {
    setTimer({
      isRunning: true,
      seconds: 0,
      projectId,
      taskId,
      notes,
    });
  };

  const stopTimer = async () => {
    if (!timer.isRunning || timer.seconds < 10) {
      setTimer({ isRunning: false, seconds: 0 });
      return;
    }

    const durationMinutes = Math.max(1, Math.round(timer.seconds / 60));
    try {
      await fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: timer.projectId,
          taskId: timer.taskId,
          durationMinutes,
          notes: timer.notes || "Live tracked work session",
          isBillable: true,
        }),
      });
    } catch (err) {
      console.error("Failed to auto-save time entry:", err);
    } finally {
      setTimer({ isRunning: false, seconds: 0 });
    }
  };

  const resetTimer = () => {
    setTimer({ isRunning: false, seconds: 0 });
  };

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        isLoading,
        theme,
        toggleTheme,
        timer,
        startTimer,
        stopTimer,
        resetTimer,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function useAuth() {
  const { session } = useApp();
  return {
    user: session?.user,
    membership: session?.membership,
    company: session?.company,
    permissions: session?.permissions || [],
  };
}
