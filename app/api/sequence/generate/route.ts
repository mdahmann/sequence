import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateSequence as generateAISequence } from "@/app/api/generate-sequence/handler"

// Schema for sequence parameters validation
const sequenceParamsSchema = z.object({
  duration: z.number().min(5).max(90),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  style: z.enum(["vinyasa", "hatha", "yin", "power", "restorative"]),
  focus: z.enum(["full body", "upper body", "lower body", "core", "balance", "flexibility"]),
  additionalNotes: z.string().optional()
})

export async function POST(req: NextRequest) {
  console.log("Starting POST /api/sequence/generate")
  
  try {
    // Parse the request body
    const requestBody = await req.json()
    console.log("Validating sequence parameters")
    
    // Validate the request parameters using Zod
    const validatedParams = sequenceParamsSchema.safeParse(requestBody)
    
    if (!validatedParams.success) {
      const errorMessage = validatedParams.error.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join(", ")
      
      console.error(`Invalid sequence parameters: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    
    console.log("Parameters validated successfully, generating sequence")

    // Call the sequence generation service
    const sequence = await serverSequenceService.generateSequence(validatedParams.data)
    
    console.log("Sequence generated successfully")
    
    // Return the generated sequence
    return NextResponse.json(sequence, { status: 201 })
  } catch (error: any) {
    console.error("Error generating sequence:", error)
    
    // Return a 500 error
    return NextResponse.json(
      { error: `Error generating sequence: ${error.message}` },
      { status: 500 }
    )
  }
} 