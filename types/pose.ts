export type PoseCategory =
  | "standing"
  | "seated"
  | "supine"
  | "prone"
  | "arm_balance"
  | "inversion"
  | "balance"
  | "forward_bend"
  | "backbend"
  | "twist"
  | "side_bend"
  | "uncategorized"

export type PoseDifficulty = "beginner" | "intermediate" | "advanced"

export interface Pose {
  id: string
  english_name: string
  sanskrit_name: string | null
  translation_name: string | null
  category: PoseCategory | null
  difficulty_level: PoseDifficulty | null
  description: string | null
  benefits: string | null
  side_option: string | null
  alternative_english_name: string | null
  contraindications: string | null
  props_needed: string | null
  drishti: string | null
  breath_instructions: string | null
  sequencing_notes: string | null
  preparatory_poses: string[] | null
  transition_poses: string[] | null
  counter_poses: string[] | null
  hold_duration: string | null
  pose_variations: any[] | null
  anatomical_focus: string[] | null
  chakra_association: string | null
  tags: string[] | null
  image_url: string | null
  created_at: string
  updated_at: string
}

