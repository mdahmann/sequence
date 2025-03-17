import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"

// Schema for sequence parameters validation
const sequenceParamsSchema = z.object({
  duration: z.number().min(5).max(90),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  style: z.enum(["vinyasa", "hatha", "yin", "power", "restorative"]),
  focus: z.enum(["full body", "upper body", "lower body", "core", "balance", "flexibility"]),
  additionalNotes: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validatedParams = sequenceParamsSchema.safeParse(body)
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validatedParams.error.format() },
        { status: 400 }
      )
    }
    
    try {
      // Generate sequence
      const sequence = await serverSequenceService.generateSequence(validatedParams.data)
      
      // Return generated sequence
      return NextResponse.json({ sequence }, { status: 201 })
    } catch (error: any) {
      console.error("Error in sequence generation:", error.message)
      
      // Handle specific error types
      if (error.message === "UNAUTHENTICATED_USER") {
        return NextResponse.json(
          { 
            error: "Authentication required", 
            message: "Please sign in or create an account to generate sequences." 
          },
          { status: 401 }
        )
      }
      
      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          { 
            error: "User account issue", 
            message: "Your user account is not properly set up. Please contact support." 
          },
          { status: 403 }
        )
      }
      
      // Generic error handling
      return NextResponse.json(
        { 
          error: "Sequence generation failed", 
          message: error.message || "An unexpected error occurred" 
        },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error("API Route: Unhandled error:", error)
    return NextResponse.json(
      { error: "Failed to process request", message: error.message || "Unknown error" },
      { status: 500 }
    )
  }
} 