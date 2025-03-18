import { NextRequest, NextResponse } from "next/server"
import { serverSequenceService } from "@/lib/services/server-sequence-service"
import { createServerSupabaseClient } from "@/lib/supabase"

// Cache for in-progress requests to prevent duplicates
const inProgressRequests: Record<string, Promise<any>> = {};

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
    
    // Check if this sequence is already being processed
    if (sequenceId in inProgressRequests) {
      console.log(`API: Request for sequence ${sequenceId} is already in progress, reusing existing promise`)
      try {
        // Wait for the existing request to complete
        const result = await inProgressRequests[sequenceId]
        return NextResponse.json(result)
      } catch (error) {
        // If the existing request failed, we'll try again below
        console.error(`API: Previous request for ${sequenceId} failed, trying again`)
      }
    }
    
    // Create a new promise for this request
    const requestPromise = (async () => {
      // Fetch stored poses from database
      const supabase = await createServerSupabaseClient()
      const { data: poses, error: posesError } = await supabase
        .from('poses')
        .select('*')
      
      if (posesError || !poses) {
        console.error("Error fetching poses:", posesError || "No poses found")
        throw new Error("Failed to fetch poses")
      }
      
      console.log(`API: Found ${poses.length} poses to use`)
      
      // Get the sequence structure from localStorage on the client
      // Try to get it directly from serverSequenceService to fill with poses
      try {
        // First we need to get the sequence from localStorage 
        // that the client passed back to us
        if (!structure) {
          throw new Error("Missing sequence structure")
        }
        
        console.log(`API: Filling structure with poses using serverSequenceService`)
        
        // Process the poses
        const processedPoses = serverSequenceService.processPoses(poses);
        
        // Organize poses by name for quick lookup
        const posesByName = new Map();
        processedPoses.forEach(pose => {
          posesByName.set(pose.name.toLowerCase(), pose);
        });
        
        // Use the serverSequenceService to fill in the poses
        const params = {
          duration: structure.duration_minutes,
          difficulty: difficulty as any,
          style: style as any,
          focus: focus as any,
          additionalNotes: structure.notes
        };
        
        console.log(`API: Structure has ${structure.phases.length} phases with IDs:`, 
          structure.phases.map((p: any) => p.id)
        );
        
        // Call the fill poses method directly
        const filledSequence = await serverSequenceService.fillSequenceWithPoses(
          structure, // The structure contains all the sequence segments already
          params,
          processedPoses
        );
        
        // Make sure to keep the same ID
        filledSequence.id = sequenceId;
        filledSequence.structureOnly = false;
        
        // CRITICAL FIX: Ensure all original phase IDs are preserved
        if (structure.phases && structure.phases.length > 0) {
          console.log(`API: BEFORE preservation - filled sequence has ${filledSequence.phases.length} phases with IDs:`, 
            filledSequence.phases.map((p: any) => p.id)
          );
          
          // If the number of phases matches, we can preserve the original IDs
          if (structure.phases.length === filledSequence.phases.length) {
            // Map the original phase IDs onto the filled sequence
            filledSequence.phases = filledSequence.phases.map((phase: any, index: number) => {
              // Keep the original phase ID but take all other properties from the filled phase
              return {
                ...phase,
                id: structure.phases[index].id
              };
            });
            
            console.log(`API: AFTER preservation - filled sequence has ${filledSequence.phases.length} phases with IDs:`, 
              filledSequence.phases.map((p: any) => p.id)
            );
          } else {
            console.log(`API: Phase count mismatch! Original: ${structure.phases.length}, Filled: ${filledSequence.phases.length}`);
            
            // Try to match as many phases as we can
            const minPhaseCount = Math.min(structure.phases.length, filledSequence.phases.length);
            
            // Preserve IDs for the phases we have
            for (let i = 0; i < minPhaseCount; i++) {
              filledSequence.phases[i].id = structure.phases[i].id;
            }
            
            console.log(`API: After partial phase ID preservation - filled sequence has ${filledSequence.phases.length} phases with IDs:`, 
              filledSequence.phases.map((p: any) => p.id)
            );
          }
        }
        
        console.log(`API: Successfully filled sequence with poses: ${sequenceId}`)
        
        return filledSequence
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
              poses: poses.slice(0, 2).map((pose: any, i: number) => {
                // Ensure pose has a Sanskrit name
                return {
                id: `pose-${pose.id}-${i}`,
                pose_id: pose.id,
                name: pose.english_name || pose.name,
                sanskrit_name: pose.sanskrit_name || "",
                duration_seconds: 60,
                position: i + 1,
                side_option: null
              }})
            },
            {
              id: "phase2",
              name: "Warm-Up",
              description: "Gentle movements to prepare the body",
              poses: poses.slice(2, 5).map((pose: any, i: number) => ({
                id: `pose-${pose.id}-${i}`,
                pose_id: pose.id,
                name: pose.english_name || pose.name,
                sanskrit_name: pose.sanskrit_name || "",
                duration_seconds: 30,
                position: i + 3,
                side_option: null
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
                sanskrit_name: pose.sanskrit_name || "",
                duration_seconds: 45,
                position: i + 6,
                side: i % 2 === 0 ? "left" : "right",
                side_option: "left_right"
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
                sanskrit_name: pose.sanskrit_name || "",
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
                sanskrit_name: pose.sanskrit_name || "",
                duration_seconds: 180,
                position: i + 13,
                side_option: null
              }))
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_favorite: false
        }
        
        console.log(`API: Used fallback to generate poses for sequence: ${sequenceId}`)
        
        return filledSequence
      }
    })();
    
    // Store the promise in our cache
    inProgressRequests[sequenceId] = requestPromise;
    
    try {
      // Wait for the promise to resolve
      const result = await requestPromise;
      
      // Clean up the cache after a delay
      setTimeout(() => {
        delete inProgressRequests[sequenceId];
      }, 5000);
      
      return NextResponse.json(result);
    } catch (error: any) {
      // Clean up the cache immediately on error
      delete inProgressRequests[sequenceId];
      
      console.error("API: Error completing pose generation:", error);
      return NextResponse.json(
        { error: error.message || "Failed to complete pose generation" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API: Error completing pose generation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to complete pose generation" },
      { status: 500 }
    )
  }
} 