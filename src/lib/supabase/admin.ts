import { createClient } from "@supabase/supabase-js";

// Server-only connection with full access, for scheduled jobs.
// Needs SUPABASE_SERVICE_ROLE_KEY in Vercel. Never use this in pages players can trigger.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
