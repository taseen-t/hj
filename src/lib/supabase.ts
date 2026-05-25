import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function hasSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function photoBucket(): string {
  return process.env.SUPABASE_PHOTO_BUCKET || "application-photos";
}

let client: SupabaseClient | null = null;

// Server-only client using the service role key. It bypasses RLS, so it must
// never be imported into client components.
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}
