export interface Pose {
  id: string;
  name: string;
  sanskrit_name?: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  category?: string;
  duration_seconds?: number;
  image_url?: string;
}

export interface SequencePhase {
  id: string;
  name: string;
  phase_type: "warm_up" | "main_sequence" | "cool_down";
  poses: Pose[];
  duration_minutes?: number;
  notes?: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  style: string;
  focus: string;
  phases: SequencePhase[];
  created_at: string;
  updated_at?: string;
  user_id?: string;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
} 