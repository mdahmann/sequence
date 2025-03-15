import { createServerSupabaseClient } from "@/lib/supabase"
import { Sequence, SequenceParams, SequencePhase } from "@/types/sequence"

// Simple implementation for the beta version
// Uses crypto.randomUUID() instead of external dependencies
export const serverSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    const supabase = createServerSupabaseClient()
    
    // Create unique IDs
    const createId = () => crypto.randomUUID()
    const sequenceId = createId()
    const now = new Date().toISOString()
    
    // Generate sample phases for the beta
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
          {
            id: createId(),
            pose_id: "pose4",
            name: "Triangle Pose",
            sanskrit_name: "Trikonasana",
            duration_seconds: 45,
            side: "right",
            position: 5,
            image_url: "/poses/triangle.jpg"
          },
          {
            id: createId(),
            pose_id: "pose4",
            name: "Triangle Pose",
            sanskrit_name: "Trikonasana",
            duration_seconds: 45,
            side: "left",
            position: 6,
            image_url: "/poses/triangle.jpg"
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
            pose_id: "pose5",
            name: "Seated Forward Bend",
            sanskrit_name: "Paschimottanasana",
            duration_seconds: 60,
            position: 7,
            image_url: "/poses/seated-forward-bend.jpg"
          },
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
    
    // In a real implementation, we would save the sequence data to the database
    // For the beta, we just return the generated sequence
    
    return sequence
  }
} 