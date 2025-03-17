/**
 * Sequence Service
 * Adapted from Vite app's sequenceGenerationService.ts
 */

import { createServerSupabaseClient } from "@/lib/supabase";

// Define sequence types
export interface SequenceParams {
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  style: 'vinyasa' | 'hatha' | 'yin' | 'restorative' | 'power';
  focusArea?: string;
  additionalNotes?: string;
}

export type SequenceDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SequenceStyle = 'vinyasa' | 'hatha' | 'yin' | 'restorative' | 'power';
export type SequenceFocus = 
  'hip_openers' | 
  'backbends' | 
  'forward_bends' | 
  'twists' | 
  'inversions' | 
  'arm_balances' | 
  'balance' | 
  'core';

export interface SequencePose {
  id: string;
  position: number;
  duration?: string;
  side?: 'left' | 'right' | 'both';
  cues?: string[];
  poseData?: Pose;
}

export interface Pose {
  id: string;
  english_name: string;
  sanskrit_name?: string;
  category?: string;
  difficulty_level?: string;
  is_bilateral?: boolean;
  side_option?: string;
  image_url?: string;
}

export interface SequencePhase {
  id: string;
  name: string;
  description?: string;
  poses: SequencePose[];
  duration?: number; // Total duration of the phase in seconds
}

export interface Sequence {
  id: string;
  title: string;
  description?: string;
  params: SequenceParams;
  phases: SequencePhase[];
  created_at: string;
  updated_at: string;
  user_id?: string;
  is_ai_generated?: boolean;
  totalDuration?: number; // Total duration in seconds
}

// Function to map database sequence to our phase-based structure
export async function mapDBSequenceToPhases(dbSequence: any): Promise<Sequence> {
  const supabase = createServerSupabaseClient();
  
  // Get all poses in this sequence
  const { data: sequencePoses, error: posesError } = await supabase
    .from("sequence_poses")
    .select(`
      id, 
      sequence_id, 
      pose_id, 
      position, 
      duration, 
      side, 
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
    .eq("sequence_id", dbSequence.id)
    .order("position");
    
  if (posesError) {
    console.error("Error fetching sequence poses:", posesError);
    throw new Error(`Failed to fetch sequence poses: ${posesError.message}`);
  }
  
  // Map to our SequencePose type
  const mappedPoses: SequencePose[] = [];
  
  for (const sp of sequencePoses) {
    // Only process if poses data exists
    if (sp.poses) {
      mappedPoses.push({
        id: sp.id,
        position: sp.position,
        duration: sp.duration,
        side: sp.side as 'left' | 'right' | 'both' | undefined,
        cues: sp.cues,
        poseData: {
          id: sp.poses.id,
          english_name: sp.poses.english_name,
          sanskrit_name: sp.poses.sanskrit_name,
          category: sp.poses.category,
          difficulty_level: sp.poses.difficulty_level,
          is_bilateral: sp.poses.is_bilateral,
          side_option: sp.poses.side_option,
          image_url: sp.poses.image_url,
        }
      });
    }
  }
  
  // Group poses into phases based on position
  // For now, create 4 phases with poses distributed among them
  let phases: SequencePhase[] = [
    {
      id: "phase-1",
      name: "Centering and Breath Awareness",
      description: "Begin with centering the mind and body, focusing on breath awareness.",
      poses: [],
    },
    {
      id: "phase-2",
      name: "Warm-up Movements",
      description: "Gently awaken the body with movements that promote joint mobility.",
      poses: [],
    },
    {
      id: "phase-3",
      name: "Main Sequence",
      description: "The core of the practice, focusing on the selected style and difficulty.",
      poses: [],
    },
    {
      id: "phase-4",
      name: "Cool Down and Relaxation",
      description: "Gently bring the practice to a close with cooling poses and relaxation.",
      poses: [],
    },
  ];
  
  // Distribute poses among phases
  const posesPerPhase = Math.ceil(mappedPoses.length / phases.length);
  
  mappedPoses.forEach((pose, index) => {
    const phaseIndex = Math.min(Math.floor(index / posesPerPhase), phases.length - 1);
    phases[phaseIndex].poses.push(pose);
  });
  
  // Filter out empty phases
  phases = phases.filter(phase => phase.poses.length > 0);
  
  // Calculate durations
  for (const phase of phases) {
    let phaseDuration = 0;
    for (const pose of phase.poses) {
      // Parse duration (could be in format like "5 breaths" or "30 seconds")
      const durationMatch = pose.duration ? pose.duration.match(/(\d+)/) : null;
      const durationValue = durationMatch ? parseInt(durationMatch[1]) : 30;
      phaseDuration += durationValue;
    }
    phase.duration = phaseDuration;
  }
  
  // Calculate total duration
  const totalDuration = phases.reduce((total, phase) => total + (phase.duration || 0), 0);
  
  // Map to our Sequence type
  return {
    id: dbSequence.id,
    title: dbSequence.title,
    description: dbSequence.description,
    params: {
      duration: dbSequence.duration,
      difficulty: dbSequence.difficulty_level as SequenceDifficulty,
      style: dbSequence.style as SequenceStyle,
      focusArea: dbSequence.focus_area,
    },
    phases,
    created_at: dbSequence.created_at,
    updated_at: dbSequence.updated_at,
    user_id: dbSequence.user_id,
    is_ai_generated: dbSequence.is_ai_generated,
    totalDuration,
  };
}

// Function to get a sequence with phases
export async function getSequenceWithPhases(sequenceId: string): Promise<Sequence | null> {
  const supabase = createServerSupabaseClient();
  
  // Get the sequence
  const { data: sequence, error } = await supabase
    .from("sequences")
    .select("*")
    .eq("id", sequenceId)
    .single();
    
  if (error) {
    console.error("Error fetching sequence:", error);
    return null;
  }
  
  if (!sequence) {
    return null;
  }
  
  try {
    // Map to our phase-based structure
    return await mapDBSequenceToPhases(sequence);
  } catch (err) {
    console.error("Error mapping sequence to phases:", err);
    return null;
  }
}

// Function to save sequence phases back to the database
export async function saveSequencePhases(
  sequenceId: string, 
  title: string,
  phases: SequencePhase[]
): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  
  try {
    // First update the sequence title if needed
    const { error: titleError } = await supabase
      .from("sequences")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", sequenceId);
      
    if (titleError) {
      console.error("Error updating sequence title:", titleError);
      return false;
    }
    
    // Flatten all poses from all phases
    const allPoses = phases.flatMap((phase, phaseIndex) => 
      phase.poses.map((pose, poseIndex) => ({
        id: pose.id,
        position: phaseIndex * 1000 + poseIndex * 10, // Ensure poses stay in their phases
        duration: pose.duration,
        side: pose.side,
        cues: pose.cues,
      }))
    );
    
    // Update each sequence pose
    for (const pose of allPoses) {
      const { error } = await supabase
        .from("sequence_poses")
        .update({
          position: pose.position,
          duration: pose.duration,
          side: pose.side,
          cues: pose.cues,
        })
        .eq("id", pose.id);
        
      if (error) {
        console.error(`Error updating pose ${pose.id}:`, error);
        // Continue with other poses even if one fails
      }
    }
    
    return true;
  } catch (err) {
    console.error("Error saving sequence phases:", err);
    return false;
  }
} 