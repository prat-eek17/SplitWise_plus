import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase instance. Safe to call repeatedly; @supabase/ssr
 * handles session storage via cookies so auth state survives refreshes
 * and works with the server client below.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
