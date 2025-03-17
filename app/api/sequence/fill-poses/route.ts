import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { SequenceStructure, SequenceSegment } from "@/types/sequence"

// Schema for fill-poses request
const fillPosesRequestSchema = z.object({
  structure: z.object({
    name: z.string(),
    description: z.string(),
    intention: z.string().optional(),
    segments: z.array(z.object({
      name: z.string(),
      description: z.string(),
      duration_minutes: z.number().optional(),
      intensity: z.string().optional()
    }))
  }),
  params: z.object({
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
})

export async function POST(request: NextRequest) {
  try {
    // Create supabase server client
    const supabase = createServerSupabaseClient()
    
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
    const result = fillPosesRequestSchema.safeParse(body)
    if (!result.success) {
      console.error("Validation error:", result.error)
      return NextResponse.json(
        { error: "Invalid request parameters", details: result.error.format() },
        { status: 400 }
      )
    }
    
    // Get data from request
    const { structure: structureData, params } = result.data
    
    // Convert segments to the proper format
    const segments: SequenceSegment[] = structureData.segments.map(segment => ({
      name: segment.name,
      description: segment.description,
      durationMinutes: segment.duration_minutes || 5, // Default to 5 min if not provided
      intensityLevel: segment.intensity ? parseInt(segment.intensity) : 5, // Convert string intensity to number
      poseTypes: [], // We'll fill these in the server
      purpose: segment.name // Use name as the purpose for now
    }))
    
    // Convert to proper SequenceStructure type
    const structure: SequenceStructure = {
      name: structureData.name,
      description: structureData.description,
      intention: structureData.intention || "", // Convert to non-optional string
      segments: segments
    }
    
    // Get poses from database
    const { data: poses, error: posesError } = await supabase
      .from('poses')
      .select('*')
    
    if (posesError || !poses) {
      console.error("Error fetching poses:", posesError || "No poses found")
      return NextResponse.json(
        { error: "Failed to fetch poses for sequence" },
        { status: 500 }
      )
    }
    
    // Process poses to normalize naming
    const processedPoses = serverSequenceService.processPoses(poses)
    
    // Fill the sequence with poses
    const sequence = await serverSequenceService.fillSequenceWithPoses(structure, params, processedPoses)
    
    // Return the sequence
    return NextResponse.json({ sequence })
  } catch (error: any) {
    console.error("Error filling sequence with poses:", error)
    return NextResponse.json(
      { error: "Error filling sequence with poses", details: error.message },
      { status: 500 }
    )
  }
} 