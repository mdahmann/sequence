import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Schema for sequence parameters
const sequenceParamsSchema = z.object({
  duration: z.number().int().positive().max(90),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  style: z.enum(["vinyasa", "hatha", "yin", "power", "restorative"]),
  focus: z.enum(["full body", "upper body", "lower body", "core", "balance", "flexibility"]),
  additionalNotes: z.string().optional(),
  peakPose: z.object({
    id: z.string(),
    name: z.string(),
    sanskrit_name: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Create supabase server client with proper cookie handling
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })
    
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Get request body
    const body = await request.json()
    
    // Validate request body
    const result = sequenceParamsSchema.safeParse(body)
    if (!result.success) {
      console.error("Validation error:", result.error)
      return NextResponse.json(
        { error: "Invalid request parameters", details: result.error.format() },
        { status: 400 }
      )
    }
    
    // Generate sequence structure
    const { duration, difficulty, style, focus, additionalNotes, peakPose } = result.data
    const structure = await serverSequenceService.generateSequenceStructure({
      duration,
      difficulty,
      style,
      focus,
      additionalNotes,
      peakPose
    })
    
    // Return the structure
    return NextResponse.json({ structure })
  } catch (error: any) {
    console.error("Error generating sequence structure:", error)
    return NextResponse.json(
      { error: "Error generating sequence structure", details: error.message },
      { status: 500 }
    )
  }
} 