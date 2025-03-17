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
  cues?: string
  position: number
  sanskrit_name?: string
  image_url?: string
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
} 