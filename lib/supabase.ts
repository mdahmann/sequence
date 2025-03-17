import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Create a Supabase client for server-side use - direct client without cookies
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

// Client components should use the useSupabase hook from the providers context
// This ensures a single instance of the Supabase client is used across the application

