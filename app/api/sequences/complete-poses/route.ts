import { NextRequest, NextResponse } from "next/server"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase"

// API endpoint to complete pose generation after showing the initial structure
export async function POST(req: NextRequest) {
  try {
    const { sequenceId, difficulty, style, focus, structure } = await req.json()
    
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
    
    // Get the sequence structure from localStorage on the client
    // Try to get it directly from serverSequenceService to fill with poses
    try {
      // First we need to get the sequence from localStorage 
      // that the client passed back to us
      if (!structure) {
        return NextResponse.json(
          { error: "Missing sequence structure" },
          { status: 400 }
        )
      }
      
      console.log(`API: Filling structure with poses using serverSequenceService`)
      
      // Process the poses
      const processedPoses = serverSequenceService.processPoses(poses);
      
      // Use the serverSequenceService to fill in the poses
      const params = {
        duration: structure.duration_minutes,
        difficulty: difficulty as any,
        style: style as any,
        focus: focus as any,
        additionalNotes: structure.notes
      };
      
      // Call the fill poses method directly
      const filledSequence = await serverSequenceService.fillSequenceWithPoses(
        structure, // The structure contains all the sequence segments already
        params,
        processedPoses
      );
      
      // Make sure to keep the same ID
      filledSequence.id = sequenceId;
      filledSequence.structureOnly = false;
      
      console.log(`API: Successfully filled sequence with poses: ${sequenceId}`)
      
      return NextResponse.json(filledSequence)
    } catch (error: any) {
      console.error("Error filling structure with poses:", error)
      
      // Fallback to simulated response if the service method fails
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
      
      console.log(`API: Used fallback to generate poses for sequence: ${sequenceId}`)
      
      return NextResponse.json(filledSequence)
    }
  } catch (error: any) {
    console.error("API: Error completing pose generation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete pose generation" },
      { status: 500 }
    )
  }
} 