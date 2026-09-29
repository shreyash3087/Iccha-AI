"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, onAuthStateChange, signOutUser, signInWithGoogle, type AuthUser } from "@/lib/auth";

// ── Auth Context Types ─────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (redirectAfter?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Auth Provider ──────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      // Subscribe to Supabase auth state changes (handles OAuth callback automatically)
      unsubscribe = onAuthStateChange((u) => {
        setUser(u);
      });
    };

    void init();
    return () => { unsubscribe?.(); };
  }, []);

  const signIn = useCallback(async (redirectAfter?: string) => {
    // Save the intended destination before leaving for Google OAuth
    if (typeof window !== "undefined") {
      const destination = redirectAfter || window.location.pathname + window.location.search;
      localStorage.setItem("iccha_auth_redirect", destination);
    }
    await signInWithGoogle(redirectAfter);
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
