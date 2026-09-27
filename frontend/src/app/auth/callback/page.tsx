"use client";

/**
 * /auth/callback
 *
 * Google OAuth lands here after authentication.
 * Supabase detectSessionInUrl picks up the #access_token hash automatically.
 * AuthContext's onAuthStateChange fires → reads iccha_auth_redirect → navigates there.
 * If no redirect is stored, we fall back to /dashboard.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Poll for Supabase session detection (hash token processing)
      let user = await getCurrentUser();
      let attempts = 0;
      while (!user && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        user = await getCurrentUser();
        attempts++;
      }

      if (typeof window !== "undefined") {
        const pendingRedirect = localStorage.getItem("iccha_auth_redirect");
        if (pendingRedirect) {
          localStorage.removeItem("iccha_auth_redirect");
          router.replace(pendingRedirect);
          return;
        }
      }

      // Always go to dashboard after successful authentication
      router.replace("/dashboard");
    };

    void handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* ICCHA AI Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
          इ
        </div>
        {/* Spinner */}
        <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}
