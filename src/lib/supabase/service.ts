import { createClient } from "@supabase/supabase-js";

/** Server-only client that bypasses row-level security. It is used solely by
 *  the games code, which needs to read answer keys and write scores that
 *  visitors must never be able to touch. The key has no NEXT_PUBLIC_ prefix,
 *  so Next never sends it to the browser. Never import this from a client
 *  component. */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const gamesConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
