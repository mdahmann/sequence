/**
 * Helper functions for pose management
 */

/**
 * Determines the correct display name for a pose
 * @param pose The pose object
 * @returns The English name of the pose, with fallbacks
 */
export function getPoseDisplayName(pose: any): string {
  // Check all possible English name fields in order of preference
  return pose.english_name || pose.name || "Unknown Pose";
}

/**
 * Gets the Sanskrit name for a pose
 * @param pose The pose object
 * @returns The Sanskrit name of the pose or empty string
 */
export function getPoseSanskritName(pose: any): string {
  return pose.sanskrit_name || "";
}

/**
 * Gets both English and Sanskrit names for a pose
 * @param pose The pose object
 * @returns Object with name and sanskritName
 */
export function getPoseNames(pose: any): { name: string, sanskritName: string } {
  return {
    name: getPoseDisplayName(pose),
    sanskritName: getPoseSanskritName(pose)
  };
} 