import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
  // Create a Supabase client with the server runtime
  const cookieStore = cookies()
  
  return createClient<Database>(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_ANON_KEY!,
    {
      // Pass cookies to the Supabase client to read the session
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  )
}

// Client components should use the useSupabase hook from the providers context
// This ensures a single instance of the Supabase client is used across the application

