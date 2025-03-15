import { createServerSupabaseClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect") || "/"

  console.log("Auth callback received:", { hasCode: !!code, redirect })

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createServerSupabaseClient()
      const result = await supabase.auth.exchangeCodeForSession(code)
      console.log("Code exchange completed successfully:", !!result.data.session)
    } catch (error) {
      console.error("Error exchanging code for session:", error)
    }
  }

  console.log("Redirecting to:", `${requestUrl.origin}${redirect}`)
  return NextResponse.redirect(`${requestUrl.origin}${redirect}`)
}

