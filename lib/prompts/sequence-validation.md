# Sequence Validation Prompt

The yoga sequence you provided is not sufficient to fill the requested {{duration}} minutes of practice.

## Current Sequence Analysis
- Total poses: {{total_poses}} (expected minimum: {{expected_poses}})
- Total duration: {{current_minutes}} minutes, {{current_seconds}} seconds ({{total_seconds}} seconds)
- Requested duration: {{duration}} minutes ({{expected_seconds}} seconds)
- Style: {{style}}
- Focus: {{focus}}
- Difficulty: {{difficulty}}

## Required Improvements
Please expand the sequence by:
1. Adding more poses to existing phases
2. Ensuring each phase has at least 3-4 poses (more for vinyasa/power, fewer for restorative/yin)
3. Adjusting pose durations as needed for the {{style}} style
4. Maintaining the {{focus}} focus area theme
5. Keeping the {{difficulty}} level appropriate

## Phase Requirements
{{#each phases}}
- Phase "{{name}}": Currently has {{pose_count}} poses totaling {{phase_duration}} seconds. Please expand.
{{/each}}

## Time Requirements
- The sequence MUST fill the entire {{duration}} minutes ({{expected_seconds}} seconds)
- Include at least {{target_pose_count}} poses in total for a {{style}} practice
- Follow standard sequencing principles for {{style}} yoga
- Ensure bilateral poses have both left and right sides

## AVAILABLE POSES FOR EXPANSION
**When adding or modifying poses to meet the target duration and count, you MUST select ONLY from the following list of available poses. Ensure the `pose_id` in your response exactly matches the ID from this list for every pose:**
{{poseList}}

## Validation Steps
Before submitting your response, please verify:
1. Count the total duration of all poses in seconds
2. Ensure it matches or exceeds {{expected_seconds}} seconds
3. Confirm that each phase has an appropriate number of poses
4. Check that all bilateral poses have both left and right sides included

The complete sequence should include the current poses plus additional ones to fill the full time. 