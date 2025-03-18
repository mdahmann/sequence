import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sequence, 
  SequencePhase, 
  SequencePose,
  SequenceParams,
  SequenceStructure,
  SequenceSegment
} from '@/types/sequence'
import { getYogaGuidelines } from '@/lib/server-utils'

// Add type declaration for global cache
declare global {
  var __sequence_cache: Record<string, Sequence>;
}

// Create an OpenAI instance if the API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Define JSON schemas for OpenAI function calling
const sequenceStructureSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    intention: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          durationMinutes: { type: "number" },
          intensityLevel: { type: "number" },
          poseTypes: { 
            type: "array", 
            items: { type: "string" } 
          },
          purpose: { type: "string" }
        },
        required: ["name", "description", "durationMinutes", "intensityLevel", "poseTypes", "purpose"]
      }
    }
  },
  required: ["name", "description", "intention", "segments"]
};

// Schema for filled sequence with poses
const filledSequenceSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          poses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                sanskrit_name: { 
                  type: "string", 
                  description: "The Sanskrit name of the pose - this field is REQUIRED" 
                },
                duration_seconds: { type: "number" },
                side: { type: "string", enum: ["left", "right", "both", null] },
                transition: { type: "string" },
                cues: { 
                  type: "array", 
                  items: { type: "string" } 
                },
                breath_cue: { type: "string" },
                modifications: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["name", "sanskrit_name", "duration_seconds"]
            }
          }
        },
        required: ["name", "description", "poses"]
      }
    }
  },
  required: ["name", "description", "phases"]
};

export const serverSequenceService = {
  // Add method to get Supabase client
  async getSupabaseClient() {
    return await createServerSupabaseClient();
  },

  async generateSequence(params: SequenceParams): Promise<Sequence> {
    console.log("serverSequenceService: Generating sequence with params:", params)
    
    // Log environment variable availability (without exposing values)
    console.log("Environment variables check:", {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    })
    
    // Create a server-side Supabase client
    const supabase = await this.getSupabaseClient()
    
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
      
      // Check if we can use OpenAI
      if (openai && process.env.OPENAI_API_KEY) {
        try {
          console.log("serverSequenceService: Attempting to use OpenAI for sequence generation")
          // Process poses to normalize naming
          const processedPoses = this.processPoses(poses);
          
          // Step 1: Generate the sequence structure only
          // IMPORTANT: We are ONLY generating the structure here, not poses
          const structure = await this.generateSequenceStructure(params);
          console.log("Generated sequence structure:", structure.name);
          
          // Convert structure to sequence without poses
          const now = new Date().toISOString();
          const sequenceId = uuidv4();
          
          // Create a sequence from just the structure
          const sequence: Sequence = {
            id: sequenceId,
            name: structure.name,
            description: structure.description,
            duration_minutes: params.duration,
            difficulty: params.difficulty,
            style: params.style,
            focus: params.focus,
            phases: structure.segments.map(segment => {
              // Create a phase for each segment
              const phase: SequencePhase = {
                id: uuidv4(),
                name: segment.name,
                description: segment.description,
                poses: [] // Initially empty, will be populated later
              };
              
              // For UI display purposes, add placeholder poses
              const placeholderCount = Math.ceil(segment.durationMinutes / 2);
              for (let i = 0; i < placeholderCount; i++) {
                phase.poses.push({
                  id: `placeholder-${uuidv4()}`,
                  pose_id: "placeholder",
                  name: "__loading__", // Special marker for UI to know this is a placeholder
                  duration_seconds: 30,
                  position: i + 1
                });
              }
              
              return phase;
            }),
            created_at: now,
            updated_at: now,
            is_favorite: false,
            notes: structure.intention || params.additionalNotes || "",
            structureOnly: true // Mark this as structure-only for the UI
          };
          
          // Return just the structure - don't generate poses yet
          return sequence;
        } catch (aiError) {
          console.error("serverSequenceService: Error with OpenAI, falling back to basic generation:", aiError)
          // Fall back to basic generation if OpenAI fails
          return this.generateBasicSequence(params, poses);
        }
      } else {
        console.log("serverSequenceService: OpenAI not available, using basic generation")
        return this.generateBasicSequence(params, poses);
      }
    } catch (error: any) {
      console.error("serverSequenceService: Error generating sequence:", error.message)
      throw error
    }
  },
  
  // Process and normalize pose data
  processPoses(poses: any[]): any[] {
    return poses.map(pose => ({
      ...pose,
      // Ensure each pose has a name property that matches english_name for easier matching
      name: pose.english_name || pose.name || 'Unknown Pose',
      // Ensure Sanskrit name is passed along
      sanskrit_name: pose.sanskrit_name || null
    }));
  },
  
  // Step 1: Generate the sequence structure
  async generateSequenceStructure(params: SequenceParams): Promise<SequenceStructure> {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Get yoga guidelines content
    const yogaGuidelines = await this.getYogaGuidelines(params.style, params.focus, params.difficulty);
    
    // Build the structure prompt
    const structurePrompt = `
      As an experienced yoga teacher, create a ${params.style} yoga class structure for a ${params.duration}-minute ${params.difficulty} class focusing on ${params.focus}.
      ${params.peakPose ? `This sequence should build toward ${params.peakPose.name} as the peak pose.` : ''}
      ${params.additionalNotes ? `Additional requirements: ${params.additionalNotes}` : ''}
      
      Create a cohesive yoga practice with:
      1. Class title that captures the essence of the practice
      2. Brief overall intention/theme
      3. 4-7 logical practice segments (avoid just "warm-up, main, cool down")
      4. For each segment include:
         - Name (use simple, clear English terminology rather than Sanskrit)
         - Duration in minutes (total should equal ${params.duration})
         - Purpose/focus of this segment
         - General pose types to include (not specific poses)
         - Intensity level (1-10)
      
      YOGA STYLE GUIDELINES:
      ${yogaGuidelines}
    `;
    
    console.log("serverSequenceService: Calling OpenAI API for sequence structure");
    
    // Call OpenAI with function calling to get a structured response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an expert yoga teacher designing authentic, safe sequences following traditional yoga principles. Use simple English for phase names and section titles instead of Sanskrit. Only use Sanskrit for individual pose names when necessary."
        },
        {
          role: "user",
          content: structurePrompt
        }
      ],
      functions: [{ name: "generateStructure", parameters: sequenceStructureSchema }],
      function_call: { name: "generateStructure" }
    });
    
    // Parse the response
    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error("Failed to generate sequence structure");
    }
    
    try {
      const structure: SequenceStructure = JSON.parse(functionCall.arguments);
      console.log("serverSequenceService: Successfully generated sequence structure");
      
      // Ensure total duration matches requested duration
      const totalDuration = structure.segments.reduce((sum, segment) => sum + segment.durationMinutes, 0);
      if (totalDuration !== params.duration) {
        // Adjust durations proportionally
        const ratio = params.duration / totalDuration;
        structure.segments = structure.segments.map(segment => ({
          ...segment,
          durationMinutes: Math.round(segment.durationMinutes * ratio)
        }));
      }
      
      return structure;
    } catch (error) {
      console.error("serverSequenceService: Error parsing structure:", error);
      throw new Error("Failed to parse sequence structure");
    }
  },
  
  // Step 2: Fill the structure with specific poses
  async fillSequenceWithPoses(
    structure: SequenceStructure, 
    params: SequenceParams, 
    poses: any[]
  ): Promise<Sequence> {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Cache key for this sequence to prevent duplicate API calls
    const cacheKey = `sequence_poses_${structure.name}_${params.style}_${params.focus}`;
    
    // Check if we have a cached response
    const cachedResult = global.__sequence_cache?.[cacheKey];
    if (cachedResult) {
      console.log("serverSequenceService: Using cached sequence poses");
      return cachedResult;
    }
    
    // Organize poses by category for more efficient selection
    const organizedPoses = this.organizePosesByCategory(poses);
    
    // Get pose names list - only send relevant poses for token efficiency
    const poseNames = poses.map(pose => pose.name).join(", ");
    
    // Build the prompt for filling in poses
    const fillPosesPrompt = `
      Fill in specific poses for this ${params.style} yoga sequence structure:
      ${JSON.stringify(structure, null, 2)}
      
      For each segment, select appropriate poses that:
      1. Match the segment's purpose and intensity level
      2. Create logical transitions between poses
      3. Follow proper alignment principles
      4. Include appropriate breath guidance
      5. Match the ${params.difficulty} level
      
      IMPORTANT RULES:
      1. ONLY use poses from this list: ${poseNames}
      2. Each segment should have an appropriate number of poses based on duration and style
      3. For vinyasa, use more poses with shorter holds; for yin/restorative, use fewer poses with longer holds
      4. For each pose include:
         - id (CRITICAL: return the EXACT pose ID from the database instead of just the name)
         - name (for reference only, must match a name from the provided list)
         - sanskrit_name (for reference only)
         - duration_seconds (how long to hold the pose)
         - side (CRUCIAL: for bilateral poses, MUST BE "left", "right", or "both"; otherwise null)
         - side_option (MUST BE "left_right" for bilateral poses that are done on either side)
         - transition (brief instruction on how to move to this pose)
         - cues (array of alignment and breath cues)
      5. Bilateral poses (poses that can be done on either side) should:
         - ALWAYS include side_option: "left_right"
         - ALWAYS specify a specific side value ("left" or "right")
         - Generally be repeated on both sides sequentially in the practice (first left, then right)
         - Examples of bilateral poses: Triangle, Side Angle, Warrior I/II/III, Half Moon, etc.
      6. Use simple, clear English for ALL phase/segment names - DO NOT use Sanskrit terms for section titles
      ${params.peakPose ? `7. Include the peak pose "${params.peakPose.name}" at an appropriate point in the sequence with proper preparation and counter poses` : ''}
      
      CRITICAL: When you include pose information, include the exact pose ID from the database, not just the name.
      
      EXTREMELY IMPORTANT: You MUST generate exactly ${(structure as any).phases?.length || structure.segments.length} phases/segments. Do not create more or fewer phases than in the original structure. Keep the exact same phase names and purposes as in the original structure.
      
      Here is a reference list of pose IDs with their names and side options:
      ${poses.slice(0, 30).map(p => `ID: ${p.id} - Name: ${p.name} (${p.sanskrit_name || 'No Sanskrit name'})${p.bilateral ? ' - BILATERAL (requires side_option: "left_right")' : ''}`).join("\n")}
      ... (plus additional poses not shown for brevity)
    `;
    
    console.log("serverSequenceService: Calling OpenAI API to fill sequence with poses");
    
    // Call OpenAI with function calling to get a structured response with poses
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are an expert yoga teacher creating detailed pose sequences. Select appropriate poses for each segment of the class structure. Use simple English phase names rather than Sanskrit terminology for section titles. Reserve Sanskrit for pose names only."
        },
        {
          role: "user",
          content: fillPosesPrompt
        }
      ],
      functions: [{ name: "fillSequenceWithPoses", parameters: filledSequenceSchema }],
      function_call: { name: "fillSequenceWithPoses" }
    });
    
    // Parse the response
    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error("Failed to fill sequence with poses");
    }
    
    try {
      // Parse the generated sequence with poses
      const filledSequence = JSON.parse(functionCall.arguments);
      console.log("serverSequenceService: Successfully filled sequence with poses");
      
      // Convert to our Sequence format
      const result = this.convertToSequenceFormat(filledSequence, structure, params, poses);
      
      // Cache the result to prevent duplicate API calls
      if (!global.__sequence_cache) {
        global.__sequence_cache = {};
      }
      global.__sequence_cache[cacheKey] = result;
      
      return result;
    } catch (error) {
      console.error("serverSequenceService: Error parsing filled sequence:", error);
      throw new Error("Failed to parse filled sequence");
    }
  },
  
  // Helper method to organize poses by category
  organizePosesByCategory(poses: any[]): Record<string, any[]> {
    const organized: Record<string, any[]> = {};
    
    poses.forEach(pose => {
      const category = pose.category || 'uncategorized';
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(pose);
    });
    
    return organized;
  },
  
  // Convert the filled sequence to our Sequence format
  convertToSequenceFormat(
    filledSequence: any, 
    structure: SequenceStructure, 
    params: SequenceParams,
    poses: any[] = []
  ): Sequence {
    const now = new Date().toISOString();
    
    // Create lookup map for pose validation
    const poseIdMap = new Map();
    if (poses.length > 0) {
      poses.forEach(pose => {
        poseIdMap.set(pose.id, pose);
      });
    }
    
    // Create the sequence object
    const sequence: Sequence = {
      id: uuidv4(),
      name: filledSequence.name || structure.name,
      description: filledSequence.description || structure.description,
      duration_minutes: params.duration,
      difficulty: params.difficulty,
      style: params.style,
      focus: params.focus,
      phases: [],
      created_at: now,
      updated_at: now,
      is_favorite: false,
      notes: structure.intention || params.additionalNotes || "",
    };
    
    // Check if we have a phase count mismatch and log it
    const originalPhases = (structure as any).phases || [];
    const filledPhases = filledSequence.phases || [];
    const hasPhaseCountMismatch = originalPhases.length !== filledPhases.length;
    
    if (hasPhaseCountMismatch) {
      console.log(`WARNING: Phase count mismatch! Original: ${originalPhases.length}, Filled: ${filledPhases.length}`);
    }
    
    // If the original structure has phases, ensure we preserve them
    if (originalPhases.length > 0) {
      // Calculate how many poses to distribute to each original phase
      const allGeneratedPoses: SequencePose[] = [];
      
      // Collect all poses from the filled sequence
      if (Array.isArray(filledSequence.phases)) {
        filledSequence.phases.forEach((phase: any) => {
          if (Array.isArray(phase.poses)) {
            phase.poses.forEach((pose: any) => {
              // Process each pose and add to our collection
              // Get the database pose ID, validate it exists
              let poseId = pose.id || pose.pose_id || "unknown";
              
              // If we have the database poses, verify the ID exists
              if (poseIdMap.size > 0) {
                // If the ID doesn't exist but we have the name, try to find the pose by name
                if (!poseIdMap.has(poseId) && pose.name) {
                  const poseName = pose.name.toLowerCase();
                  // Find the first pose with a matching name
                  const matchingPose = Array.from(poseIdMap.values()).find(
                    (p) => p.name?.toLowerCase() === poseName
                  );
                  if (matchingPose) {
                    poseId = matchingPose.id;
                    console.log(`Mapped pose name "${pose.name}" to ID ${poseId}`);
                  }
                }
              }
              
              // Create a sequence pose and add to our collection
              allGeneratedPoses.push({
                id: uuidv4(),
                pose_id: poseId,
                name: pose.name,
                duration_seconds: pose.duration_seconds || 30,
                side: pose.side || null,
                side_option: pose.side === "left" || pose.side === "right" ? "left_right" : pose.side_option || null,
                cues: Array.isArray(pose.cues) ? pose.cues.join(", ") : (pose.cues || ""),
                position: 0, // Will set position later
                sanskrit_name: pose.sanskrit_name || "",
                image_url: pose.image_url,
                transition: pose.transition,
                breath_cue: pose.breath_cue || pose.breath || "",
                modifications: Array.isArray(pose.modifications) 
                  ? pose.modifications.join(", ") 
                  : (pose.modifications || "")
              });
            });
          }
        });
      }
      
      // Now distribute the poses to the original phases
      sequence.phases = originalPhases.map((originalPhase: any, phaseIndex: number) => {
        // Calculate how many poses to assign to this phase
        // Use a distribution proportional to the original phase structure
        const phaseRatio = 1 / originalPhases.length;
        const poseCount = Math.max(
          2, // Minimum 2 poses per phase
          Math.floor(allGeneratedPoses.length * phaseRatio)
        );
        
        // Calculate the starting index for poses in this phase
        const startIdx = phaseIndex * poseCount;
        // Get poses for this phase, limited by available poses
        const endIdx = Math.min(startIdx + poseCount, allGeneratedPoses.length);
        const phasePoses = allGeneratedPoses.slice(startIdx, endIdx).map((pose, poseIndex) => {
          return {
            ...pose,
            position: phaseIndex * 100 + poseIndex + 1 // Ensure sequential position numbers
          };
        });
        
        // Create the phase with original ID and metadata
        return {
          id: originalPhase.id,
          name: originalPhase.name,
          description: originalPhase.description || "",
          poses: phasePoses
        };
      });
    } else {
      // Fallback to the generated phases if no original structure
      // Process each phase/segment from the filled sequence
      if (Array.isArray(filledSequence.phases)) {
        sequence.phases = filledSequence.phases.map((phase: any, phaseIndex: number) => {
          const sequencePhase: SequencePhase = {
            id: uuidv4(),
            name: phase.name,
            description: phase.description || "",
            poses: []
          };
          
          // Map the poses in each phase
          if (Array.isArray(phase.poses)) {
            sequencePhase.poses = phase.poses.map((pose: any, poseIndex: number) => {
              // Get the database pose ID, validate it exists
              let poseId = pose.id || pose.pose_id || "unknown";
              
              // If we have the database poses, verify the ID exists
              if (poseIdMap.size > 0) {
                // If the ID doesn't exist but we have the name, try to find the pose by name
                if (!poseIdMap.has(poseId) && pose.name) {
                  const poseName = pose.name.toLowerCase();
                  // Find the first pose with a matching name
                  const matchingPose = Array.from(poseIdMap.values()).find(
                    (p) => p.name?.toLowerCase() === poseName
                  );
                  if (matchingPose) {
                    poseId = matchingPose.id;
                    console.log(`Mapped pose name "${pose.name}" to ID ${poseId}`);
                  }
                }
              }
              
              // Create a sequence pose
              const sequencePose: SequencePose = {
                id: uuidv4(),
                // Use the validated pose ID
                pose_id: poseId,
                name: pose.name,
                duration_seconds: pose.duration_seconds || 30,
                side: pose.side || null,
                side_option: pose.side === "left" || pose.side === "right" ? "left_right" : pose.side_option || null,
                cues: Array.isArray(pose.cues) ? pose.cues.join(", ") : (pose.cues || ""),
                position: phaseIndex * 100 + poseIndex + 1,
                sanskrit_name: pose.sanskrit_name || "",
                image_url: pose.image_url,
                transition: pose.transition,
                breath_cue: pose.breath_cue || pose.breath || "",
                modifications: Array.isArray(pose.modifications) 
                  ? pose.modifications.join(", ") 
                  : (pose.modifications || "")
              };
              
              return sequencePose;
            });
          }
          
          return sequencePhase;
        });
      }
    }
    
    console.log("serverSequenceService: Successfully converted to sequence format");
    return sequence;
  },
  
  // Generate a basic sequence without AI - keeping this as fallback
  generateBasicSequence(params: SequenceParams, poses: any[]): Sequence {
    console.log("serverSequenceService: Generating basic sequence");
    
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
    
    console.log("serverSequenceService: Successfully generated basic sequence", sequence.name);
    return sequence;
  },
  
  // Get yoga guidelines based on style, focus, and difficulty
  async getYogaGuidelines(style: string, focus: string, difficulty: string): Promise<string> {
    // Get basic guidelines if available
    try {
      const { getYogaGuidelines: getBasicGuidelines } = await import('@/lib/server-utils');
      const basicGuidelines = await getBasicGuidelines();
      
      // If we have basic guidelines from the file, use them
      if (basicGuidelines && basicGuidelines.trim().length > 0) {
        return basicGuidelines;
      }
    } catch (error) {
      console.error("Failed to import server utils:", error);
      // Continue with fallback guidelines
    }
    
    // Create detailed style-specific guidelines
    const styleGuidelines = {
      vinyasa: `
        - Flow smoothly from pose to pose, connecting movement with breath
        - Each movement should be coordinated with either inhale or exhale
        - Include sun salutations and variations as foundation for flow
        - Build sequences that move logically from one pose to the next
        - For ${difficulty} level, include appropriate ${difficulty === 'beginner' ? 'basic' : difficulty === 'intermediate' ? 'moderate' : 'challenging'} transitions
        - Ensure adequate warm-up before demanding poses
        - Focus on ${focus} while maintaining whole-body awareness
      `,
      hatha: `
        - Hold poses longer (30-60 seconds) with focus on alignment
        - Balance strength and flexibility
        - Include both standing and seated poses
        - For ${difficulty} level, choose ${difficulty === 'beginner' ? 'accessible' : difficulty === 'intermediate' ? 'moderate' : 'advanced'} variations
        - Ensure adequate preparation for deeper poses
        - Focus on ${focus} while creating a balanced practice
        - Include mindful transitions between poses
      `,
      yin: `
        - Long holds (3-5 minutes) in passive poses
        - Target connective tissues rather than muscles
        - Focus on relaxation and surrender
        - Props are encouraged for support
        - Minimal muscular engagement
        - Include appropriate counterposes
        - Adjust hold times based on ${difficulty} level
        - Focus on ${focus} while respecting body's limitations
      `,
      power: `
        - Emphasize strength-building elements
        - Dynamic movements and challenging transitions
        - Longer holds in strength-building poses
        - Include core work throughout the practice
        - For ${difficulty} level, include appropriate ${difficulty === 'beginner' ? 'accessible' : difficulty === 'intermediate' ? 'moderate' : 'challenging'} variations
        - Focus on ${focus} while building overall strength
        - Maintain energetic pace while ensuring proper alignment
      `,
      restorative: `
        - Very long holds (5-10 minutes) in fully supported poses
        - Extensive use of props for complete comfort
        - Focus on complete relaxation and nervous system regulation
        - Minimal transitions between poses
        - Create sense of safety and comfort
        - Adapt for ${difficulty} level appropriately
        - Focus on ${focus} through gentle, supported positions
      `
    };
    
    // Focus-specific guidance
    const focusGuidelines = {
      "full body": "Create a balanced practice that addresses all major muscle groups and movement patterns.",
      "upper body": "Include poses that open the shoulders, chest, and arms while strengthening the back and core.",
      "lower body": "Focus on poses that strengthen and stretch the legs, hips, and glutes while maintaining stability.",
      "core": "Incorporate poses that engage the abdominals, back, and pelvic floor throughout the practice.",
      "balance": "Include standing balance poses, build toward more challenging variations based on level, and include preparation/counter poses.",
      "flexibility": "Emphasize longer holds, use props as needed, and sequence logically to safely increase range of motion."
    };
    
    // Difficulty-specific guidance
    const difficultyGuidelines = {
      beginner: `
        - Simple, accessible poses with clear alignment cues
        - Slower pace with adequate rest between demanding poses
        - More detailed instructions and modifications
        - Shorter holding times (especially for challenging poses)
        - Focus on building foundation and body awareness
      `,
      intermediate: `
        - More complex poses with refined alignment details
        - Moderate pace with strategic sequencing
        - Some challenging variations with modifications offered
        - Balanced holding times suitable for practice level
        - Focus on deepening awareness and expanding repertoire
      `,
      advanced: `
        - Include challenging poses and transitions appropriate for experienced practitioners
        - Faster pace when appropriate for the style
        - Longer holding times for strength-building
        - Refined subtle body awareness cues
        - Focus on precision and advanced variations
      `
    };
    
    // Combine all guidelines
    return `
      ${styleGuidelines[style as keyof typeof styleGuidelines] || ''}
      
      FOCUS AREA (${focus}):
      ${focusGuidelines[focus as keyof typeof focusGuidelines] || ''}
      
      DIFFICULTY LEVEL (${difficulty}):
      ${difficultyGuidelines[difficulty as keyof typeof difficultyGuidelines] || ''}
      
      GENERAL SEQUENCING PRINCIPLES:
      - Always begin with centering/breath awareness
      - Warm up the body appropriately before challenging poses
      - Progress from simple to complex movements
      - Include counterposes after deep stretches or challenging poses
      - Cool down gradually toward final relaxation
      - Consider the overall arc of the practice (build up, peak, wind down)
      - Ensure the sequence is balanced (left/right, front/back, strength/flexibility)
    `;
  },

  async setAuthToken(token: string, client: any) {
    // This method can be used to set an auth token directly on the client
    // Useful for API routes that receive an Authorization header
    return await client.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  },
}