export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      poses: {
        Row: {
          id: string
          english_name: string
          sanskrit_name: string | null
          translation_name: string | null
          category: string | null
          difficulty_level: string | null
          description: string | null
          benefits: string | null
          side_option: string | null
          alternative_english_name: string | null
          contraindications: string | null
          props_needed: string | null
          drishti: string | null
          breath_instructions: string | null
          sequencing_notes: string | null
          preparatory_poses: Json | null
          transition_poses: Json | null
          counter_poses: Json | null
          hold_duration: string | null
          pose_variations: Json | null
          anatomical_focus: Json | null
          chakra_association: string | null
          tags: Json | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          english_name: string
          sanskrit_name?: string | null
          translation_name?: string | null
          category?: string | null
          difficulty_level?: string | null
          description?: string | null
          benefits?: string | null
          side_option?: string | null
          alternative_english_name?: string | null
          contraindications?: string | null
          props_needed?: string | null
          drishti?: string | null
          breath_instructions?: string | null
          sequencing_notes?: string | null
          preparatory_poses?: Json | null
          transition_poses?: Json | null
          counter_poses?: Json | null
          hold_duration?: string | null
          pose_variations?: Json | null
          anatomical_focus?: Json | null
          chakra_association?: string | null
          tags?: Json | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          english_name?: string
          sanskrit_name?: string | null
          translation_name?: string | null
          category?: string | null
          difficulty_level?: string | null
          description?: string | null
          benefits?: string | null
          side_option?: string | null
          alternative_english_name?: string | null
          contraindications?: string | null
          props_needed?: string | null
          drishti?: string | null
          breath_instructions?: string | null
          sequencing_notes?: string | null
          preparatory_poses?: Json | null
          transition_poses?: Json | null
          counter_poses?: Json | null
          hold_duration?: string | null
          pose_variations?: Json | null
          anatomical_focus?: Json | null
          chakra_association?: string | null
          tags?: Json | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sequences: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          difficulty: string
          style: string
          focus: string
          phases: Json
          created_at: string
          updated_at: string | null
          user_id: string | null
          is_favorite: boolean
          tags: string[] | null
          notes: string | null
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          duration_minutes: number
          difficulty: string
          style: string
          focus: string
          phases: Json
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          is_favorite?: boolean
          tags?: string[] | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          difficulty?: string
          style?: string
          focus?: string
          phases?: Json
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          is_favorite?: boolean
          tags?: string[] | null
          notes?: string | null
        }
      }
      sequence_poses: {
        Row: {
          id: string
          sequence_id: string
          pose_id: string
          position: number
          duration: number | null
          side: string | null
          cues: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sequence_id: string
          pose_id: string
          position: number
          duration?: number | null
          side?: string | null
          cues?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          pose_id?: string
          position?: number
          duration?: number | null
          side?: string | null
          cues?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

