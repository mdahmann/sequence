import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase"

// Schema for sequence parameters validation
const sequenceParamsSchema = z.object({
  duration: z.number().min(5).max(90),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  style: z.enum(["vinyasa", "hatha", "yin", "power", "restorative"]),
  focus: z.enum(["full body", "upper body", "lower body", "core", "balance", "flexibility"]),
  additionalNotes: z.string().optional()
})

export async function POST(req: NextRequest) {
  console.log("Starting POST request to /api/sequence/generate")
  
  // First, check authentication
  const supabase = createServerSupabaseClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error("API route: Error getting session:", sessionError)
    return NextResponse.json(
      { 
        error: "Authentication error", 
        message: "There was an error checking your authentication status." 
      },
      { status: 500 }
    )
  }
  
  if (!session?.user?.id) {
    console.log("API route: User not authenticated - returning 401")
    return NextResponse.json(
      { 
        error: "Authentication required", 
        message: "Please sign in or create an account to generate sequences." 
      },
      { status: 401 }
    )
  }
  
  console.log(`API route: User authenticated with ID ${session.user.id}`)
  console.log("API route: Auth details:", {
    userId: session.user.id,
    email: session.user.email || 'not available',
    provider: session.user.app_metadata?.provider || 'unknown',
    aud: session.user.aud,
    role: session.user.role
  })
  
  try {
    // Parse and validate request body
    const body = await req.json()
    const validatedParams = sequenceParamsSchema.safeParse(body)
    
    if (!validatedParams.success) {
      console.log("API route: Invalid parameters - returning 400")
      return NextResponse.json(
        { error: "Invalid parameters", details: validatedParams.error.format() },
        { status: 400 }
      )
    }
    
    // Generate sequence
    console.log("API route: Generating sequence...")
    const sequence = await serverSequenceService.generateSequence(validatedParams.data)
    
    // Return generated sequence
    console.log("API route: Sequence generated successfully - returning 201")
    return NextResponse.json({ sequence }, { status: 201 })
  } catch (error: any) {
    console.error("API route error:", error.message)
    
    // Handle specific error types
    if (error.message === "UNAUTHENTICATED_USER" || error.message.includes("UNAUTHENTICATED_USER")) {
      console.log("API route: Authentication error from service - returning 401")
      return NextResponse.json(
        { 
          error: "Authentication required", 
          message: "Please sign in or create an account to generate sequences." 
        },
        { status: 401 }
      )
    }
    
    if (error.message === "USER_NOT_FOUND" || error.message.includes("USER_NOT_FOUND")) {
      console.log("API route: User not found error - returning 403")
      return NextResponse.json(
        { 
          error: "User account issue", 
          message: "Your user account is not properly set up. Please contact support." 
        },
        { status: 403 }
      )
    }
    
    // Generic error handling
    console.log("API route: Generic error - returning 500")
    return NextResponse.json(
      { 
        error: "Sequence generation failed", 
        message: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    )
  }
} 