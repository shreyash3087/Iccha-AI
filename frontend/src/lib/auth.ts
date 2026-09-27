import { getSupabase } from "./supabase";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

const LOCAL_STORAGE_KEY_ID = "iccha_user_id";
const LOCAL_STORAGE_KEY_EMAIL = "iccha_user_email";
const LOCAL_STORAGE_KEY_NAME = "iccha_user_name";

/**
 * Get current authenticated user.
 * Uses getSession() (which handles the URL hash after OAuth redirect)
 * before falling back to localStorage for non-Supabase sessions.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      // getSession() reads from localStorage AND the URL hash (#access_token=...)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = session.user;
        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Merchant",
          avatar_url: user.user_metadata?.avatar_url,
        };
        // Mirror to localStorage for instantaneous recovery
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY_ID, authUser.id);
          localStorage.setItem(LOCAL_STORAGE_KEY_EMAIL, authUser.email || "");
          localStorage.setItem(LOCAL_STORAGE_KEY_NAME, authUser.name || "Merchant");
        }
        return authUser;
      }
    } catch (e) {
      console.warn("[Auth] Supabase getSession error:", e);
    }
  }

  // Fallback to local storage (for non-Supabase / demo users or cached sessions)
  if (typeof window !== "undefined") {
    const id = localStorage.getItem(LOCAL_STORAGE_KEY_ID);
    const email = localStorage.getItem(LOCAL_STORAGE_KEY_EMAIL);
    const name = localStorage.getItem(LOCAL_STORAGE_KEY_NAME);
    if (id) {
      return {
        id,
        email: email || undefined,
        name: name || "Merchant",
      };
    }
  }

  return null;
}

/**
 * Subscribe to auth state changes (sign-in / sign-out events).
 * Returns the unsubscribe function.
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Merchant",
        avatar_url: session.user.user_metadata?.avatar_url,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY_ID, authUser.id);
        localStorage.setItem(LOCAL_STORAGE_KEY_EMAIL, authUser.email || "");
        localStorage.setItem(LOCAL_STORAGE_KEY_NAME, authUser.name || "Merchant");
      }
      callback(authUser);
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/**
 * Sign in using Google OAuth via Supabase.
 * Accepts optional redirectTo to store in localStorage so /auth/callback returns user there.
 * Redirects to /auth/callback after Google OAuth completes.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Supabase not configured in .env.local" };
  }

  try {
    if (typeof window !== "undefined" && redirectTo) {
      localStorage.setItem("iccha_auth_redirect", redirectTo);
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Neutral callback page — AuthContext / callback page handles the final redirect
    const redirectUrl = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: { access_type: "offline" },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Google sign-in failed" };
  }
}

/**
 * Store merchant user in localStorage (and Supabase if anonymous/magic link).
 */
export function setLocalMerchant(email: string, name?: string): AuthUser {
  const existingId = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY_ID) : null;
  const id = existingId || `usr_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const cleanName = name || email.split("@")[0] || "Merchant";

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY_ID, id);
    localStorage.setItem(LOCAL_STORAGE_KEY_EMAIL, email);
    localStorage.setItem(LOCAL_STORAGE_KEY_NAME, cleanName);
  }

  return { id, email, name: cleanName };
}

/**
 * Sign out user and clear storage.
 */
export async function signOutUser(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY_ID);
    localStorage.removeItem(LOCAL_STORAGE_KEY_EMAIL);
    localStorage.removeItem(LOCAL_STORAGE_KEY_NAME);
  }
}
