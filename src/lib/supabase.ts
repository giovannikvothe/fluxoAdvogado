import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const urlFromEnv = import.meta.env.VITE_SUPABASE_URL;
const keyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isPlaceholderUrl(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  return (
    url.includes("your-project-ref.supabase.co") ||
    url.includes("example.supabase.co")
  );
}

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) {
    return true;
  }

  return key === "your-public-anon-key" || key === "public-anon-key";
}

export const isSupabaseConfigured = Boolean(
  urlFromEnv &&
    keyFromEnv &&
    !isPlaceholderUrl(urlFromEnv) &&
    !isPlaceholderKey(keyFromEnv),
);

const supabaseUrl = urlFromEnv ?? "https://example.supabase.co";
const supabaseAnonKey = keyFromEnv ?? "public-anon-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
