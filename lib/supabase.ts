import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a Supabase client for server-side use
export function createServerSupabaseClient() {
  try {
    // Create server component client with cookie handling
    return createServerComponentClient<Database>({
      cookies,
    })
  } catch (error) {
    console.error("Failed to create server component client:", error)
    
    // Fallback to direct client
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
}

// Client components should use the useSupabase hook from the providers context
// This ensures a single instance of the Supabase client is used across the application

