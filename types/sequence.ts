export interface SequenceParams {
  duration: number
  difficulty: "beginner" | "intermediate" | "advanced"
  style: "vinyasa" | "hatha" | "yin" | "power" | "restorative"
  focus: "full body" | "upper body" | "lower body" | "core" | "balance" | "flexibility"
  additionalNotes?: string
  peakPose?: {
    id: string
    name: string
    sanskrit_name?: string
  }
}

export interface SequencePose {
  id: string
  pose_id: string
  name: string
  duration_seconds: number
  side?: "left" | "right" | "both" | null
  side_option?: string | null
  cues?: string
  position: number
  sanskrit_name?: string
  image_url?: string
  transition?: string
  breath_cue?: string
  modifications?: string[]
}

export interface SequencePhase {
  id: string
  name: string
  description?: string
  poses: SequencePose[]
  
  // Existing new fields
  duration_minutes?: number
  intensity_level?: number
  pose_types?: string[]
  purpose?: string
  phase_type?: "centering" | "warm_up" | "building" | "peak" | "cool_down" | "closing"
  position?: number
  
  // New fields for library/AI integration
  difficulty_level?: "beginner" | "intermediate" | "advanced"
  suitable_styles?: ("vinyasa" | "hatha" | "yin" | "power" | "restorative")[]
  suitable_for_focus?: ("full body" | "upper body" | "lower body" | "core" | "balance" | "flexibility")[]
  tags?: string[]
  
  // Library metadata
  creator_id?: string
  is_public?: boolean
  usage_count?: number
  created_at?: string
  updated_at?: string
  
  // AI-friendly attributes
  preparation_for?: string // e.g., "wheel pose" - what this phase helps prepare for
  follows_well_after?: string[] // phases that this naturally follows
  precedes_well_before?: string[] // phases that work well after this
  
  // Template status
  is_template?: boolean // Is this a system template or user-created phase?
}

export interface Sequence {
  id: string
  name: string
  description?: string
  duration_minutes: number
  difficulty: string
  style: string
  focus: string
  phases: SequencePhase[]
  created_at: string
  updated_at?: string
  user_id?: string
  is_favorite: boolean
  tags?: string[]
  notes?: string
  structureOnly?: boolean // Flag to indicate this is just the structure without fully generated poses
} 