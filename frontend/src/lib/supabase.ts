import { createClient, SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

/**
 * Get the Supabase client instance.
 * Returns null if Supabase environment variables are not yet configured.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        // Automatically parse the #access_token hash after Google OAuth redirect
        detectSessionInUrl: true,
        // Keep session alive in localStorage so user stays logged in across pages
        persistSession: true,
        // Use localStorage (default) for session storage
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }

  return clientInstance;
}

/**
 * Returns true if Supabase credentials are configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && anonKey);
}
