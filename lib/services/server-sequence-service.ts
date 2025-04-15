import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { 
  Sequence, 
  SequencePhase, 
  SequencePose,
  SequenceParams
} from '@/types/sequence'
import { getYogaGuidelines } from '@/lib/server-utils'
import { 
  generateSequencePrompt, 
  generatePoseList, 
  loadSystemMessage,
  calculateTargetPoseCount,
  generateValidationPrompt 
} from '@/lib/prompt-utils'

// Add type declaration for global cache
declare global {
  var __sequence_cache: Record<string, Sequence>;
}

// Create an OpenAI instance if the API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Define JSON schema for OpenAI function calling
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

  async generateSequence(params: SequenceParams, userId: string): Promise<Sequence> {
    if (!userId) throw new Error("UNAUTHENTICATED_USER");
    console.log("serverSequenceService: Generating sequence with params:", params)
    
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
          console.log("serverSequenceService: Using OpenAI for sequence generation")
          
          // Get yoga guidelines
          const yogaGuidelines = await getYogaGuidelines(params.style, params.focus, params.difficulty);
          
          // Create the pose list for the prompt
          const poseList = generatePoseList(poses);
          console.log(`Using all ${poses.length} poses from database in prompt`);
          
          // Generate the prompt using our template system
          const sequencePrompt = await generateSequencePrompt(params, yogaGuidelines, poseList);
          
          // Load the system message from the template file
          const systemMessage = await loadSystemMessage('sequence');
          
          // Log the complete prompt being sent to OpenAI
          console.log("\n========== FULL OPENAI PROMPT ==========");
          console.log("SYSTEM MESSAGE:");
          console.log(systemMessage);
          console.log("\nUSER MESSAGE:");
          console.log(sequencePrompt);
          console.log("========== END OF PROMPT ==========\n");
          
          // Call OpenAI to generate the complete sequence
          const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: systemMessage
              },
              {
                role: "user",
                content: sequencePrompt
              }
            ],
            functions: [{ name: "generateSequence", parameters: filledSequenceSchema }],
            function_call: { name: "generateSequence" }
          });
          
          // Parse the response
          const functionCall = completion.choices[0].message.function_call;
          if (!functionCall || !functionCall.arguments) {
            throw new Error("Failed to generate sequence");
          }
          
          console.log("\n========== RAW AI RESPONSE ==========");
          console.log(functionCall.arguments);
          
          // Parse the generated sequence
          let generatedSequence = JSON.parse(functionCall.arguments);
          
          console.log("\n========== PARSED AI RESPONSE ==========");
          console.log(JSON.stringify(generatedSequence, null, 2));
          
          // Calculate expected duration and pose count
          const expectedDurationSeconds = params.duration * 60;
          const expectedPoseCount = calculateTargetPoseCount(params.style, params.duration);
          
          // Count total poses and duration in the generated sequence
          let totalPoses = 0;
          let totalDurationSeconds = 0;
          
          if (generatedSequence.phases && generatedSequence.phases.length > 0) {
            generatedSequence.phases.forEach((phase: any) => {
              if (phase.poses && phase.poses.length > 0) {
                totalPoses += phase.poses.length;
                phase.poses.forEach((pose: any) => {
                  totalDurationSeconds += pose.duration_seconds || 0;
                });
              }
            });
          }
          
          console.log("\n========== SEQUENCE ANALYSIS ==========");
          console.log(`Total phases: ${generatedSequence.phases?.length || 0}`);
          console.log(`Total poses: ${totalPoses} (expected minimum: ${expectedPoseCount})`);
          console.log(`Total duration: ${Math.floor(totalDurationSeconds / 60)} minutes, ${totalDurationSeconds % 60} seconds (expected: ${params.duration} minutes)`);
          
          // Check if sequence is sufficient
          const isSequenceTooShort = totalPoses < expectedPoseCount || totalDurationSeconds < expectedDurationSeconds * 0.8;
          
          // If sequence is insufficient, request more poses
          if (isSequenceTooShort) {
            console.log("\n========== SEQUENCE VALIDATION FAILED ==========");
            console.log(`Sequence is too short: ${totalPoses} poses, ${totalDurationSeconds} seconds`);
            console.log("Requesting expanded sequence...");
            
            try {
              // Generate validation prompt to request more poses
              const validationPrompt = await generateValidationPrompt(
                params,
                generatedSequence,
                expectedPoseCount,
                totalPoses,
                totalDurationSeconds,
                expectedDurationSeconds
              );
              
              console.log("\n========== SENDING VALIDATION PROMPT ==========");
              console.log(validationPrompt);
              
              // Make a follow-up request to get a more complete sequence
              const completionRequest = await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                temperature: 0.7,
                messages: [
                  {
                    role: "system",
                    content: "You are an expert yoga teacher specialized in creating complete, well-timed sequences. Your task is to expand a sequence that is too short to fill the requested time."
                  },
                  {
                    role: "user",
                    content: validationPrompt
                  }
                ],
                functions: [{ name: "generateSequence", parameters: filledSequenceSchema }],
                function_call: { name: "generateSequence" }
              });
              
              // Parse the expanded response
              const expandedFunctionCall = completionRequest.choices[0].message.function_call;
              if (!expandedFunctionCall || !expandedFunctionCall.arguments) {
                throw new Error("Failed to generate expanded sequence");
              }
              
              console.log("\n========== EXPANDED SEQUENCE RESPONSE ==========");
              console.log(expandedFunctionCall.arguments);
              
              // Replace the original sequence with the expanded one
              const expandedSequence = JSON.parse(expandedFunctionCall.arguments);
              
              // Verify the expanded sequence
              let expandedTotalPoses = 0;
              let expandedTotalDurationSeconds = 0;
              
              if (expandedSequence.phases && expandedSequence.phases.length > 0) {
                expandedSequence.phases.forEach((phase: any) => {
                  if (phase.poses && phase.poses.length > 0) {
                    expandedTotalPoses += phase.poses.length;
                    phase.poses.forEach((pose: any) => {
                      expandedTotalDurationSeconds += pose.duration_seconds || 0;
                    });
                  }
                });
              }
              
              console.log(`Expanded sequence: ${expandedTotalPoses} poses, ${Math.floor(expandedTotalDurationSeconds / 60)} minutes, ${expandedTotalDurationSeconds % 60} seconds`);
              
              // Use the expanded sequence if it's better than the original
              if (expandedTotalPoses > totalPoses && expandedTotalDurationSeconds > totalDurationSeconds) {
                console.log("Using expanded sequence as it's more complete");
                // Use the expanded sequence for the rest of the process
                generatedSequence = expandedSequence;
                totalPoses = expandedTotalPoses;
                totalDurationSeconds = expandedTotalDurationSeconds;
              } else {
                console.log("Expanded sequence isn't better than original, using original");
              }
            } catch (error) {
              console.error("Error expanding sequence:", error);
              console.log("Continuing with original sequence despite validation failure");
            }
          }
          
          // Analyze sequence
          console.log("\n========== FINAL SEQUENCE ANALYSIS ==========");
          console.log(`Total phases: ${generatedSequence.phases?.length || 0}`);
          console.log(`Total poses: ${totalPoses} (expected minimum: ${expectedPoseCount})`);
          console.log(`Total duration: ${Math.floor(totalDurationSeconds / 60)} minutes, ${totalDurationSeconds % 60} seconds (expected: ${params.duration} minutes)`);
          
          let totalLeftPoses = 0;
          let totalRightPoses = 0;
          
          if (generatedSequence.phases && generatedSequence.phases.length > 0) {
            generatedSequence.phases.forEach((phase: any, idx: number) => {
              const leftPoses = phase.poses?.filter((p: any) => p.side === 'left')?.length || 0;
              const rightPoses = phase.poses?.filter((p: any) => p.side === 'right')?.length || 0;
              
              console.log(`Phase ${idx+1}: "${phase.name}" - ${phase.poses?.length || 0} poses (Left: ${leftPoses}, Right: ${rightPoses})`);
              
              totalLeftPoses += leftPoses;
              totalRightPoses += rightPoses;
            });
          }
          
          console.log(`\nBilateral balance - Left: ${totalLeftPoses}, Right: ${totalRightPoses}`);
          console.log("========== END OF SEQUENCE ANALYSIS ==========\n");
          
          // Convert to our Sequence format
          const sequence = this.convertToSequenceFormat(generatedSequence, poses, params);
          
          // Store in database
          const { error: dbError } = await supabase
            .from('sequences')
            .insert([{
              id: sequence.id,
              user_id: userId,
              title: sequence.name,
              description: sequence.description || '',
              duration: sequence.duration_minutes,
              difficulty_level: sequence.difficulty,
              style: sequence.style,
              focus_area: sequence.focus,
              is_ai_generated: true,
            }]);
          
          if (dbError) {
            console.error("Error storing sequence:", dbError);
            // Don't throw error here, just log it
          }
          
          return sequence;
          
        } catch (aiError) {
          console.error("serverSequenceService: Error with OpenAI, falling back to basic generation:", aiError)
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
  
  // Convert the filled sequence to our Sequence format
  convertToSequenceFormat(
    filledSequence: any, 
    poses: any[] = [], 
    params: SequenceParams
  ): Sequence {
    console.log("Converting sequence to format...");
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
      name: filledSequence.name,
      description: filledSequence.description,
      duration_minutes: params.duration,
      difficulty: params.difficulty,
      style: params.style,
      focus: params.focus,
      phases: [],
      created_at: now,
      updated_at: now,
      is_favorite: false,
      notes: filledSequence.notes || params.additionalNotes || "",
    };
    
    // Map the generated phases
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
            let poseName = pose.name;
            let sanskritName = pose.sanskrit_name;
              
            // If we have the database poses, verify the ID exists and get the correct name
              if (poseIdMap.size > 0) {
              const dbPose = poseIdMap.get(poseId);
              if (dbPose) {
                poseName = dbPose.english_name || dbPose.name;
                sanskritName = dbPose.sanskrit_name;
                console.log(`Found pose in DB: ID=${poseId}, english_name=${poseName}, name=${dbPose.name}`);
              } else if (pose.name) {
                // If the ID doesn't exist but we have the name, try to find the pose by name
                const poseNameLower = pose.name.toLowerCase();
                  const matchingPose = Array.from(poseIdMap.values()).find(
                  (p) => p.english_name?.toLowerCase() === poseNameLower || 
                         p.name?.toLowerCase() === poseNameLower
                  );
                  if (matchingPose) {
                    poseId = matchingPose.id;
                  poseName = matchingPose.english_name || matchingPose.name;
                  sanskritName = matchingPose.sanskrit_name;
                  console.log(`Mapped pose name "${pose.name}" to ID ${poseId}, english_name=${poseName}`);
                }
              }
            }
            
            // Create a sequence pose with proper name handling
              const sequencePose: SequencePose = {
                id: uuidv4(),
                pose_id: poseId,
              name: poseName || pose.name || "Unknown Pose", // Always ensure we have an English name
                duration_seconds: pose.duration_seconds || 30,
                side: pose.side || null,
                side_option: pose.side === "left" || pose.side === "right" ? "left_right" : pose.side_option || null,
                cues: Array.isArray(pose.cues) ? pose.cues.join(", ") : (pose.cues || ""),
                position: phaseIndex * 100 + poseIndex + 1,
              sanskrit_name: sanskritName || pose.sanskrit_name || "", // Sanskrit name as secondary
                image_url: pose.image_url,
                transition: pose.transition,
                breath_cue: pose.breath_cue || pose.breath || "",
                modifications: Array.isArray(pose.modifications) 
                  ? pose.modifications.join(", ") 
                  : (pose.modifications || "")
              };
            
            console.log(`Created sequence pose: name=${sequencePose.name}, sanskrit_name=${sequencePose.sanskrit_name}`);
              
              return sequencePose;
            });
          }
          
          return sequencePhase;
        });
      }
    
    console.log("Successfully converted to sequence format");
    
    // Analyze bilateral pose balance in the final sequence
    console.log("\n========== FINAL SEQUENCE BILATERAL ANALYSIS ==========");
    let totalLeftPoses = 0;
    let totalRightPoses = 0;
    let bilateralPoses: Record<string, {left: number, right: number, names: Set<string>}> = {};
    
    if (sequence.phases && sequence.phases.length > 0) {
      sequence.phases.forEach((phase: SequencePhase, idx: number) => {
        const leftPoses = phase.poses?.filter(p => p.side === 'left')?.length || 0;
        const rightPoses = phase.poses?.filter(p => p.side === 'right')?.length || 0;
        
        console.log(`Phase ${idx+1}: "${phase.name}" - ${phase.poses?.length || 0} poses (Left: ${leftPoses}, Right: ${rightPoses})`);
        
        // Track specific bilateral poses by pose_id
        phase.poses.forEach(pose => {
          if (pose.side === 'left' || pose.side === 'right') {
            if (!bilateralPoses[pose.pose_id]) {
              bilateralPoses[pose.pose_id] = {left: 0, right: 0, names: new Set()};
            }
            bilateralPoses[pose.pose_id][pose.side as 'left' | 'right']++;
            bilateralPoses[pose.pose_id].names.add(pose.name);
          }
        });
        
        totalLeftPoses += leftPoses;
        totalRightPoses += rightPoses;
      });
    }
    
    console.log(`\nOverall bilateral balance - Left: ${totalLeftPoses}, Right: ${totalRightPoses}`);
    
    // Check individual pose balance
    console.log("\nIndividual pose balance:");
    Object.entries(bilateralPoses).forEach(([poseId, data]) => {
      const names = Array.from(data.names).join('/');
      const balanced = data.left === data.right;
      console.log(`- ${names} (ID: ${poseId}): Left: ${data.left}, Right: ${data.right} ${balanced ? '✓' : '⚠ UNBALANCED'}`);
    });
    
    console.log("========== END OF BILATERAL ANALYSIS ==========\n");
    
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
    };
    
    // Try to store the sequence in the database - Using the same format as in generateSequence
    try {
      (async () => {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.from('sequences').insert([{
          id: sequence.id,
          user_id: uuidv4(), // Generate a valid UUID instead of using 'anonymous'
          title: sequence.name,
          description: sequence.description || '',
          duration: sequence.duration_minutes,
          difficulty_level: sequence.difficulty,
          style: sequence.style,
          focus_area: sequence.focus,
          is_ai_generated: true,
        }]);
        
        if (error) {
          console.log("Error storing basic sequence:", error);
        }
      })().catch(error => {
        console.error("Failed to store basic sequence:", error);
      });
    } catch (error) {
      console.error("Failed to store basic sequence:", error);
      // Continue without failing
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
          name: pose.english_name || pose.name,  // Use english_name first, then fall back to name
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
            name: pose.english_name || pose.name,  // Use english_name first, then fall back to name
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

  async setAuthToken(token: string, client: any) {
    // This method can be used to set an auth token directly on the client
    // Useful for API routes that receive an Authorization header
    return await client.auth.setSession({
      access_token: token,
      refresh_token: "",
    });
  },
}