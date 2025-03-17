import { NextRequest, NextResponse } from "next/server"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase"

// API endpoint to complete pose generation after showing the initial structure
export async function POST(req: NextRequest) {
  try {
    const { sequenceId, difficulty, style, focus } = await req.json()
    
    console.log(`API: Complete poses requested for sequence: ${sequenceId}`)
    
    if (!sequenceId) {
      return NextResponse.json(
        { error: "Missing sequence ID" },
        { status: 400 }
      )
    }
    
    // Fetch stored poses from database
    const supabase = await createServerSupabaseClient()
    const { data: poses, error: posesError } = await supabase
      .from('poses')
      .select('*')
    
    if (posesError || !poses) {
      console.error("Error fetching poses:", posesError || "No poses found")
      return NextResponse.json(
        { error: "Failed to fetch poses" },
        { status: 500 }
      )
    }
    
    console.log(`API: Found ${poses.length} poses to use`)
    
    // In a real implementation, we would use the stored sequence structure
    // Here we'll simulate completing the sequence by fetching it from localStorage on the client
    
    // For this demo, we'll just return a complete sequence with dummy data
    // This would normally be handled by serverSequenceService.fillSequenceWithPoses
    
    // Simulate the creation of a filled sequence
    const filledSequence = {
      id: sequenceId,
      name: `${difficulty} ${style} - ${focus} Practice`,
      description: "A yoga sequence focused on " + focus,
      duration_minutes: 30,
      difficulty,
      style,
      focus,
      phases: [
        {
          id: "phase1",
          name: "Centering & Breath Awareness",
          description: "Begin seated to center and connect with your breath",
          poses: poses.slice(0, 2).map((pose: any, i: number) => ({
            id: `pose-${pose.id}-${i}`,
            pose_id: pose.id,
            name: pose.english_name || pose.name,
            sanskrit_name: pose.sanskrit_name,
            duration_seconds: 60,
            position: i + 1
          }))
        },
        {
          id: "phase2",
          name: "Warm-Up",
          description: "Gentle movements to prepare the body",
          poses: poses.slice(2, 5).map((pose: any, i: number) => ({
            id: `pose-${pose.id}-${i}`,
            pose_id: pose.id,
            name: pose.english_name || pose.name,
            sanskrit_name: pose.sanskrit_name,
            duration_seconds: 30,
            position: i + 3
          }))
        },
        {
          id: "phase3",
          name: "Standing Sequence",
          description: "Build strength and balance through standing poses",
          poses: poses.slice(5, 9).map((pose: any, i: number) => ({
            id: `pose-${pose.id}-${i}`,
            pose_id: pose.id,
            name: pose.english_name || pose.name,
            sanskrit_name: pose.sanskrit_name,
            duration_seconds: 45,
            position: i + 6,
            side: i % 2 === 0 ? "left" : "right"
          }))
        },
        {
          id: "phase4",
          name: "Floor Sequence",
          description: "Seated and reclined poses for flexibility",
          poses: poses.slice(9, 12).map((pose: any, i: number) => ({
            id: `pose-${pose.id}-${i}`,
            pose_id: pose.id,
            name: pose.english_name || pose.name,
            sanskrit_name: pose.sanskrit_name,
            duration_seconds: 60,
            position: i + 10
          }))
        },
        {
          id: "phase5",
          name: "Final Relaxation",
          description: "Complete relaxation to integrate practice benefits",
          poses: poses.slice(12, 13).map((pose: any, i: number) => ({
            id: `pose-${pose.id}-${i}`,
            pose_id: pose.id,
            name: pose.english_name || pose.name,
            sanskrit_name: pose.sanskrit_name,
            duration_seconds: 180,
            position: i + 13
          }))
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false
    }
    
    console.log(`API: Successfully generated poses for sequence: ${sequenceId}`)
    
    return NextResponse.json(filledSequence)
  } catch (error: any) {
    console.error("API: Error completing pose generation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete pose generation" },
      { status: 500 }
    )
  }
} 