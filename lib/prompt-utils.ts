import fs from 'fs';
import path from 'path';
import { SequenceParams } from '@/types/sequence';

/**
 * Load a prompt template from a markdown file and replace placeholders with values
 */
export async function loadPromptTemplate(templateName: string, replacements: Record<string, string>): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'lib', 'prompts', `${templateName}.md`);
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with values
    let filledTemplate = template;
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      filledTemplate = filledTemplate.replace(placeholder, value || '');
    }
    
    return filledTemplate;
  } catch (error) {
    console.error(`Error loading prompt template ${templateName}:`, error);
    throw new Error(`Failed to load prompt template: ${templateName}`);
  }
}

/**
 * Generate a formatted list of poses for inclusion in AI prompts
 */
export function generatePoseList(poses: any[], limit?: number): string {
  // If limit is provided, use it, otherwise use all poses
  const posesToUse = limit ? poses.slice(0, limit) : poses;
  
  return posesToUse.map(p => 
    `ID: ${p.id} - Name: ${p.name || p.english_name} (${p.sanskrit_name || 'No Sanskrit name'}) ${(p.side_option === 'left_right' || p.side_option === true || p.is_bilateral) ? '- BILATERAL (requires both left and right sides)' : ''}`
  ).join("\n");
}

/**
 * Generate a sequence prompt using the template and sequence parameters
 */
export async function generateSequencePrompt(params: SequenceParams, yogaGuidelines: string, poseList: string): Promise<string> {
  // Calculate target pose count based on style and duration
  const targetPoseCount = calculateTargetPoseCount(params.style, params.duration);
  const durationSeconds = params.duration * 60;
  
  const replacements = {
    style: params.style,
    duration: params.duration.toString(),
    difficulty: params.difficulty,
    focus: params.focus,
    additionalNotes: params.additionalNotes ? `- Additional Notes: ${params.additionalNotes}` : '',
    peakPose: params.peakPose ? `- Peak Pose: ${params.peakPose.name}` : '',
    yogaGuidelines,
    poseList,
    target_pose_count: targetPoseCount.toString(),
    duration_minutes: params.duration.toString(),
    duration_seconds: durationSeconds.toString()
  };
  
  return loadPromptTemplate('sequence-prompt', replacements);
}

/**
 * Load the system message for a specific prompt type
 */
export async function loadSystemMessage(type: string): Promise<string> {
  try {
    const messagePath = path.join(process.cwd(), 'lib', 'prompts', `${type}-system-message.md`);
    return fs.readFileSync(messagePath, 'utf8');
  } catch (error) {
    console.error(`Error loading system message for ${type}:`, error);
    // Return a default system message if the file can't be loaded
    return "You are an AI assistant specialized in yoga instruction. Create safe, effective sequences.";
  }
}

/**
 * Get the appropriate difficulty variation text based on difficulty level
 */
export function getDifficultyVariationText(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return 'basic';
    case 'intermediate':
      return 'moderate';
    case 'advanced':
      return 'challenging';
    default:
      return 'appropriate';
  }
}

/**
 * Generate a validation prompt for requesting expanded sequences
 */
export async function generateValidationPrompt(
  params: SequenceParams,
  currentSequence: any,
  expectedPoseCount: number,
  totalPoses: number,
  totalDurationSeconds: number,
  expectedDurationSeconds: number
): Promise<string> {
  // Calculate duration values for the prompt
  const currentMinutes = Math.floor(totalDurationSeconds / 60);
  const currentSeconds = totalDurationSeconds % 60;
  
  // Build phase information
  const phaseInfo = (currentSequence.phases || []).map((phase: any) => {
    const phasePoses = phase.poses || [];
    const phaseDuration = phasePoses.reduce((sum: number, pose: any) => sum + (pose.duration_seconds || 0), 0);
    
    return {
      name: phase.name,
      pose_count: phasePoses.length,
      phase_duration: phaseDuration
    };
  });
  
  // Format phase info as text (simple implementation of handlebars-like {{#each}})
  let phaseText = '';
  phaseInfo.forEach((phase: {name: string, pose_count: number, phase_duration: number}) => {
    phaseText += `- Phase "${phase.name}": Currently has ${phase.pose_count} poses totaling ${phase.phase_duration} seconds. Please expand.\n`;
  });
  
  // Calculate target pose count based on style and duration
  const targetPoseCount = calculateTargetPoseCount(params.style, params.duration);
  
  const replacements = {
    duration: params.duration.toString(),
    total_poses: totalPoses.toString(),
    expected_poses: expectedPoseCount.toString(),
    current_minutes: currentMinutes.toString(),
    current_seconds: currentSeconds.toString(),
    total_seconds: totalDurationSeconds.toString(),
    expected_seconds: expectedDurationSeconds.toString(),
    style: params.style,
    focus: params.focus,
    difficulty: params.difficulty,
    phases: phaseText, // Replace the handlebars-style {{#each phases}} with formatted text
    target_pose_count: targetPoseCount.toString()
  };
  
  return loadPromptTemplate('sequence-validation', replacements);
}

/**
 * Calculate target pose count based on yoga style and duration
 */
export function calculateTargetPoseCount(style: string, durationMinutes: number): number {
  const style_lower = style.toLowerCase();
  
  // Adjust based on typical pose counts per minute for different styles
  if (style_lower === 'restorative' || style_lower === 'yin') {
    // Fewer poses with longer holds (roughly 1 pose per 5 minutes)
    return Math.max(5, Math.ceil(durationMinutes / 5));
  } else if (style_lower === 'hatha') {
    // Medium pace (roughly 1 pose per 2 minutes)
    return Math.max(8, Math.ceil(durationMinutes / 2));
  } else if (style_lower === 'vinyasa' || style_lower === 'power') {
    // More poses with shorter holds (roughly 1 pose per minute or more)
    return Math.max(10, Math.ceil(durationMinutes / 0.75));
  } else {
    // Default medium pace
    return Math.max(8, Math.ceil(durationMinutes / 1.5));
  }
} 