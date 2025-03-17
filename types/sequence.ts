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

// New interface for the first step of sequence generation - the structure
export interface SequenceStructure {
  name: string
  description: string
  intention: string
  segments: SequenceSegment[]
}

// More authentic terminology than "phase"
export interface SequenceSegment {
  name: string
  description: string
  durationMinutes: number
  intensityLevel: number // 1-10
  poseTypes: string[]
  purpose: string
}

export interface SequencePose {
  id: string
  pose_id: string
  name: string
  duration_seconds: number
  side?: "left" | "right" | "both" | null
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