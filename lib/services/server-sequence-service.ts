import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sequence, 
  SequencePhase, 
  SequencePose,
  SequenceParams
} from '@/types/sequence'

// Leave OpenAI for later implementation - for now generate a simple sequence
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// })

export const serverSequenceService = {
  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("serverSequenceService: Generating sequence with params:", params)
    
    // Log environment variable availability (without exposing values)
    console.log("Environment variables check:", {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    })
    
    // Create a server-side Supabase client
    const supabase = createServerSupabaseClient()
    
    try {
      // Fetch all poses from the database without requiring authentication
      const { data: poses, error: posesError } = await supabase
        .from('poses')
        .select('*')
      
      if (posesError || !poses) {
        console.error("serverSequenceService: Error fetching poses:", posesError || "No poses found")
        throw new Error("Failed to fetch poses")
      }
      
      console.log(`serverSequenceService: Successfully fetched ${poses.length} poses from database`)
      
      // For now, skip OpenAI and generate a basic sequence
      // Get a sample of poses based on difficulty and focus
      const filteredPoses = poses.filter(pose => {
        // Simple filter matching - will be replaced by OpenAI later
        const matchesDifficulty = 
          (params.difficulty === 'beginner' && pose.difficulty_level === 'beginner') ||
          (params.difficulty === 'intermediate' && 
            ['beginner', 'intermediate'].includes(pose.difficulty_level || '')) ||
          (params.difficulty === 'advanced');
            
        const matchesFocus = 
          params.focus === 'full body' || 
          (pose.category || '').toLowerCase().includes(params.focus);
            
        return matchesDifficulty && matchesFocus;
      });
      
      // If we don't have enough poses after filtering, use all poses
      const posesToUse = filteredPoses.length >= 6 ? filteredPoses : poses;
      
      // Calculate poses per phase
      const totalPoses = Math.min(posesToUse.length, Math.floor(params.duration / 3));
      const phaseLengths = {
        warmUp: Math.max(2, Math.floor(totalPoses * 0.3)),
        mainSequence: Math.max(3, Math.floor(totalPoses * 0.5)),
        coolDown: Math.max(1, Math.floor(totalPoses * 0.2))
      };
      
      const now = new Date().toISOString();
      
      // Create a properly formatted sequence object
      const sequence: Sequence = {
        id: uuidv4(),
        name: `${params.duration} min ${params.difficulty} ${params.style} for ${params.focus}`,
        description: `A ${params.duration} minute ${params.difficulty} ${params.style} yoga sequence focusing on ${params.focus}.`,
        duration_minutes: params.duration,
        difficulty: params.difficulty,
        style: params.style,
        focus: params.focus,
        notes: params.additionalNotes || "",
        phases: [],
        created_at: now,
        updated_at: now,
        is_favorite: false
      }
      
      // Create phases
      const phaseStructure = [
        {
          name: "Warm Up",
          description: "Gentle poses to prepare the body",
          count: phaseLengths.warmUp
        },
        {
          name: "Main Sequence",
          description: "Core yoga practice focusing on " + params.focus,
          count: phaseLengths.mainSequence
        },
        {
          name: "Cool Down",
          description: "Gentle poses to finish practice",
          count: phaseLengths.coolDown
        }
      ];
      
      // Build phases
      let poseIndex = 0;
      sequence.phases = phaseStructure.map((phaseInfo, phaseIndex) => {
        const sequencePhase: SequencePhase = {
          id: uuidv4(),
          name: phaseInfo.name,
          description: phaseInfo.description,
          poses: []
        };
        
        // Add poses to this phase
        for (let i = 0; i < phaseInfo.count && poseIndex < posesToUse.length; i++) {
          const pose = posesToUse[poseIndex % posesToUse.length];
          poseIndex++;
          
          // For bilateral poses, add both sides
          const side = pose.is_bilateral ? (i % 2 === 0 ? "right" : "left") : null;
          
          const sequencePose: SequencePose = {
            id: uuidv4(),
            pose_id: pose.id || "unknown",
            name: pose.name,
            duration_seconds: 30,
            side: side,
            cues: "Focus on proper alignment and breathe deeply",
            position: phaseIndex * 100 + i + 1,
            sanskrit_name: pose.sanskrit_name,
            image_url: pose.image_url
          };
          
          sequencePhase.poses.push(sequencePose);
          
          // If bilateral, add the second side immediately after
          if (pose.is_bilateral && side === "right") {
            const secondSidePose: SequencePose = {
              id: uuidv4(),
              pose_id: pose.id || "unknown",
              name: pose.name,
              duration_seconds: 30,
              side: "left",
              cues: "Focus on proper alignment and breathe deeply",
              position: phaseIndex * 100 + i + 1.5,
              sanskrit_name: pose.sanskrit_name,
              image_url: pose.image_url
            };
            sequencePhase.poses.push(secondSidePose);
          }
        }
        
        return sequencePhase;
      });
      
      console.log("serverSequenceService: Successfully generated sequence", sequence.name)
      return sequence;
      
    } catch (error: any) {
      console.error("serverSequenceService: Error generating sequence:", error.message)
      throw error
    }
  },
  
  // No longer needed with the simplified implementation
  // Will be used when we reintroduce OpenAI integration
  /*
  buildPrompt(params: SequenceParams, poses: any[]): string {
    // Create a list of available pose names to include in the prompt
    const poseNames = poses.map(pose => pose.name).join(", ")
    
    return `
    Create a yoga sequence with the following parameters:
    - Duration: ${params.duration} minutes
    - Difficulty: ${params.difficulty}
    - Style: ${params.style}
    - Focus Area: ${params.focus}
    - Additional Notes: ${params.additionalNotes || "None"}
    
    IMPORTANT RULES:
    1. ONLY use poses from this list: ${poseNames}
    2. Create a sequence with exactly 3 phases: "Warm Up", "Main Sequence", and "Cool Down"
    3. Each phase should have an appropriate duration that adds up to the total requested duration
    4. Match the difficulty level requested
    5. For each pose include:
       - name (must exactly match a name from the provided list)
       - duration_seconds (how long to hold the pose)
       - side (if applicable, either "left", "right", or null)
       - transition (brief instruction on how to move to this pose)
       - description (short description of the pose)
       - cues (array of alignment cues or breathing instructions)
    
    Return the sequence as a JSON object with this structure:
    {
      "name": "Name of the sequence",
      "description": "Description of the sequence",
      "phases": [
        {
          "name": "Warm Up",
          "description": "Description of this phase",
          "poses": [
            {
              "name": "Pose Name",
              "description": "Description of this pose",
              "duration_seconds": number,
              "side": "left" | "right" | null,
              "transition": "How to transition to this pose",
              "cues": ["Cue 1", "Cue 2"]
            },
            ...more poses
          ]
        },
        ...more phases
      ]
    }
    `
  },
  */

  async setAuthToken(token: string, client: any) {
    // This method can be used to set an auth token directly on the client
    // Useful for API routes that receive an Authorization header
    return await client.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  },
} 