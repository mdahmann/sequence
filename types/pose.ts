export type PoseCategory = 
  | "standing"
  | "seated"
  | "supine"
  | "prone"
  | "arm_balance"
  | "inversion"
  | "balance"
  | "twist"
  | "forward_bend"
  | "back_bend"
  | "hip_opener"
  | "shoulder_opener"
  | "core"
  | "restorative"
  | "other";

export type PoseDifficulty = "beginner" | "intermediate" | "advanced";

export interface Pose {
  id: string;
  name: string;
  sanskrit_name?: string;
  description?: string;
  difficulty?: PoseDifficulty;
  category?: PoseCategory;
  duration_seconds?: number;
  image_url?: string;
  transitions?: {
    [key: string]: string[];
  };
  props?: string[];
  modifications?: string[];
  benefits?: string[];
  contraindications?: string[];
} 