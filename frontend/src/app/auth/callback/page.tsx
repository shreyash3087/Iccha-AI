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
      // 1. Immediately read intended redirect from localStorage
      let destination: string | null = null;
      if (typeof window !== "undefined") {
        destination = localStorage.getItem("iccha_auth_redirect");
      }

      // 2. Poll for Supabase session detection (hash token processing)
      let user = await getCurrentUser();
      let attempts = 0;
      while (!user && attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        user = await getCurrentUser();
        attempts++;
      }

      // 3. Fallback check if destination was set during poll
      if (!destination && typeof window !== "undefined") {
        destination = localStorage.getItem("iccha_auth_redirect");
      }

      // 4. Resolve clean final destination — prevent loops back to /call, /login, or /
      let finalTarget = "/dashboard";
      if (
        destination &&
        destination !== "/" &&
        destination !== "/call" &&
        destination !== "/login"
      ) {
        finalTarget = destination;
      }

      // 5. If destination is a storefront (/temp/...), link storefront to logged-in user
      if (user && finalTarget.startsWith("/temp/")) {
        const slug = finalTarget
          .replace("/temp/", "")
          .split("?")[0]
          .replace(/[^a-zA-Z0-9_-]/g, "");
        if (slug) {
          try {
            await fetch("/api/storefronts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "approve",
                slug,
                userId: user.id,
                userEmail: user.email,
              }),
            });
          } catch (e) {
            console.warn("[AuthCallback] Could not auto-link storefront:", e);
          }
        }
      }

      // 6. Clean up stored redirect key
      if (typeof window !== "undefined") {
        localStorage.removeItem("iccha_auth_redirect");
      }

      // 7. Perform clean browser navigation to destination
      window.location.replace(finalTarget);
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
