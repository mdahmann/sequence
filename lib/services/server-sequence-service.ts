import { createServerSupabaseClient } from "@/lib/supabase"
import { Sequence, SequenceParams, SequencePhase, SequencePose } from "@/types/sequence"
import { generateSequence as generateAISequence } from "@/app/api/generate-sequence/handler"

// Uses the OpenAI integration to generate yoga sequences
export const serverSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    const supabase = createServerSupabaseClient()
    
    // Create unique IDs
    const createId = () => crypto.randomUUID()
    const sequenceId = createId()
    const now = new Date().toISOString()
    
    try {
      // Fetch user ID from session (or use a placeholder ID for non-authenticated users)
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || createId() // Use a generated UUID instead of "anonymous"
      
      // Call the existing AI sequence generator
      const { sequence: generatedSequence, error } = await generateAISequence({
        userId,
        duration: params.duration,
        difficulty: params.difficulty,
        style: params.style,
        focusArea: params.focus,
        additionalNotes: params.additionalNotes
      })
      
      if (error) {
        console.error("Error generating sequence with AI:", error)
        throw new Error(`Failed to generate sequence: ${error}`)
      }
      
      if (!generatedSequence) {
        throw new Error("No sequence was generated")
      }
      
      // Fetch the newly created sequence with its poses
      const { data: sequencePoses, error: posesError } = await supabase
        .from("sequence_poses")
        .select(`
          id, 
          sequence_id, 
          pose_id, 
          position, 
          duration, 
          cues,
          poses (
            id, 
            english_name, 
            sanskrit_name, 
            category, 
            difficulty_level, 
            is_bilateral,
            side_option,
            image_url
          )
        `)
        .eq("sequence_id", generatedSequence.id)
        .order("position")
      
      if (posesError) {
        throw new Error(`Failed to fetch sequence poses: ${posesError.message}`)
      }
      
      // Group poses into phases for the sequence
      const phases: SequencePhase[] = [
        {
          id: createId(),
          name: "Warm Up",
          description: "Gentle poses to prepare the body",
          poses: []
        },
        {
          id: createId(),
          name: "Main Sequence",
          description: "Core yoga practice",
          poses: []
        },
        {
          id: createId(),
          name: "Cool Down",
          description: "Gentle poses to finish practice",
          poses: []
        }
      ]
      
      // Distribute poses among phases
      const totalPoses = sequencePoses.length
      const warmUpEnd = Math.floor(totalPoses * 0.25) // First 25% are warm-up
      const coolDownStart = Math.floor(totalPoses * 0.75) // Last 25% are cool-down
      
      sequencePoses.forEach((pose, index) => {
        // Skip poses with no pose data
        if (!pose.poses) return
        
        // Access the pose data - from Supabase, poses is an object, not an array
        // Use unknown as intermediate type to fix the TypeScript error
        const poseData = (pose.poses as unknown) as {
          id: string
          english_name: string
          sanskrit_name?: string
          category?: string
          difficulty_level?: string
          is_bilateral?: boolean
          side_option?: string
          image_url?: string
        }
        
        // Create a sequence pose object
        const sequencePose: SequencePose = {
          id: pose.id,
          pose_id: pose.pose_id,
          name: poseData.english_name,
          sanskrit_name: poseData.sanskrit_name || undefined,
          duration_seconds: parseDuration(pose.duration),
          position: pose.position,
          image_url: poseData.image_url,
          cues: pose.cues || [],
          side: poseData.is_bilateral ? (index % 2 === 0 ? "right" : "left") as "right" | "left" : undefined
        }
        
        // Add to the appropriate phase
        if (index < warmUpEnd) {
          phases[0].poses.push(sequencePose)
        } else if (index >= coolDownStart) {
          phases[2].poses.push(sequencePose)
        } else {
          phases[1].poses.push(sequencePose)
        }
      })
      
      // Filter out empty phases
      const nonEmptyPhases = phases.filter(phase => phase.poses.length > 0)
      
      // Create the final sequence object
      const sequence: Sequence = {
        id: generatedSequence.id,
        name: generatedSequence.title,
        description: generatedSequence.description,
        duration_minutes: params.duration,
        difficulty: params.difficulty,
        style: params.style,
        focus: params.focus,
        phases: nonEmptyPhases,
        created_at: now,
        updated_at: now,
        is_favorite: false,
        notes: params.additionalNotes,
      }
      
      // NOTE: We're NOT saving this sequence to Supabase at this point.
      // It will only be saved if the user explicitly saves it from the editor.
      
      // Delete the temporarily created sequence from the database
      // since we're returning it but not saving it yet
      await supabase
        .from("sequences")
        .delete()
        .eq("id", generatedSequence.id)
      
      return sequence
    } catch (error) {
      console.error("Error in generateSequence:", error)
      
      // If AI generation fails, fall back to a basic sequence structure
      // This ensures the app doesn't crash if the AI service is unavailable
      const phases: SequencePhase[] = [
        {
          id: createId(),
          name: "Warm Up",
          description: "Gentle poses to prepare the body",
          poses: [
            {
              id: createId(),
              pose_id: "pose1",
              name: "Mountain Pose",
              sanskrit_name: "Tadasana",
              duration_seconds: 30,
              position: 1,
              image_url: "/poses/mountain.jpg"
            },
            {
              id: createId(),
              pose_id: "pose2",
              name: "Standing Forward Fold",
              sanskrit_name: "Uttanasana",
              duration_seconds: 45,
              position: 2,
              image_url: "/poses/forward-fold.jpg"
            },
          ]
        },
        {
          id: createId(),
          name: "Main Sequence",
          description: "Core yoga practice",
          poses: [
            {
              id: createId(),
              pose_id: "pose3",
              name: "Warrior I",
              sanskrit_name: "Virabhadrasana I",
              duration_seconds: 60,
              side: "right",
              position: 3,
              image_url: "/poses/warrior-1.jpg"
            },
            {
              id: createId(),
              pose_id: "pose3",
              name: "Warrior I",
              sanskrit_name: "Virabhadrasana I",
              duration_seconds: 60,
              side: "left",
              position: 4,
              image_url: "/poses/warrior-1.jpg"
            },
          ]
        },
        {
          id: createId(),
          name: "Cool Down",
          description: "Gentle poses to finish practice",
          poses: [
            {
              id: createId(),
              pose_id: "pose6",
              name: "Corpse Pose",
              sanskrit_name: "Savasana",
              duration_seconds: 180,
              position: 8,
              image_url: "/poses/savasana.jpg"
            },
          ]
        }
      ]
      
      const sequence: Sequence = {
        id: sequenceId,
        name: `${params.duration} min ${params.focus} ${params.style} sequence`,
        description: `A ${params.difficulty} ${params.style} sequence focusing on ${params.focus}`,
        duration_minutes: params.duration,
        difficulty: params.difficulty,
        style: params.style,
        focus: params.focus,
        phases: phases,
        created_at: now,
        updated_at: now,
        is_favorite: false,
        notes: params.additionalNotes,
      }
      
      return sequence
    }
  }
}

// Helper function to parse duration string to seconds
function parseDuration(duration?: string): number {
  if (!duration) return 30; // Default to 30 seconds
  
  // Check if it's a number of breaths
  const breathsMatch = duration.match(/(\d+)\s*breath/i);
  if (breathsMatch) {
    // Assume each breath is about 5 seconds
    return parseInt(breathsMatch[1]) * 5;
  }
  
  // Check if it's seconds
  const secondsMatch = duration.match(/(\d+)\s*sec/i);
  if (secondsMatch) {
    return parseInt(secondsMatch[1]);
  }
  
  // Try to just parse a number
  const numberMatch = duration.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  // Default
  return 30;
} 