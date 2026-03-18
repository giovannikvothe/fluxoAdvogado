import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const urlFromEnv = import.meta.env.VITE_SUPABASE_URL;
const keyFromEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(urlFromEnv && keyFromEnv);

const supabaseUrl = urlFromEnv ?? "https://example.supabase.co";
const supabaseAnonKey = keyFromEnv ?? "public-anon-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
