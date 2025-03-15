import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client for server-side use
// This approach uses service role key for server operations
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!, 
    // Use the service role key for server-side operations
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
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

