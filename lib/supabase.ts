import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Don't persist the session in the browser
        autoRefreshToken: false,
      }
    }
  )
}

// Client components should use the useSupabase hook from the providers context
// This ensures a single instance of the Supabase client is used across the application

