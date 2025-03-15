import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect") || "/"

  console.log("Auth callback received:", { hasCode: !!code, redirect })

  if (code) {
    try {
      const supabase = createServerSupabaseClient()
      const result = await supabase.auth.exchangeCodeForSession(code)
      console.log("Code exchange completed successfully:", !!result.data.session)
      
      // Set cookies in the response
      const response = NextResponse.redirect(`${requestUrl.origin}${redirect}`)
      
      // Add a cache-control header to prevent caching
      response.headers.set('Cache-Control', 'no-store, max-age=0')
      
      return response
    } catch (error) {
      console.error("Error exchanging code for session:", error)
    }
  }

  console.log("Redirecting to:", `${requestUrl.origin}${redirect}`)
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
}

