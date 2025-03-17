import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"

// Schema for sequence parameters validation
const sequenceParamsSchema = z.object({
  duration: z.number().min(5).max(90),
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
    
    // Generate sequence
    const sequence = await serverSequenceService.generateSequence(validatedParams.data)
    
    // Return generated sequence
    return NextResponse.json({ sequence }, { status: 201 })
    
  } catch (error: any) {
    console.error("Error generating sequence:", error)
    
    // Handle different error types
    if (error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to generate sequence", message: error.message || "Unknown error" },
      { status: 500 }
    )
  }
} 