# Sequence Generation Prompt

Create a complete {{style}} yoga sequence with the following parameters:
- Duration: {{duration}} minutes
- Difficulty: {{difficulty}}
- Style: {{style}}
- Focus Area: {{focus}}
{{additionalNotes}}
{{peakPose}}

## YOGA GUIDELINES
{{yogaGuidelines}}

## IMPORTANT RULES
1. Create 4-7 logical practice segments (phases)
2. Each phase should have:
   - A clear name and purpose
   - Appropriate poses for that phase
   - Logical progression
3. For each pose include:
   - Exact pose ID from the database
   - Duration in seconds
   - Side (left/right/both) for bilateral poses
   - Clear alignment cues
   - Breath guidance
4. Follow proper yoga sequencing principles:
   - Warm up appropriately
   - Build toward peak poses
   - Include counterposes
   - Cool down gradually
5. CRITICAL: For bilateral poses (poses that can be done on either side):
   - You MUST include BOTH left and right sides in the sequence
   - Add them one after another (first left, then right OR first right, then left)
   - ALWAYS specify the exact side in the "side" field as either "left" or "right"
   - DO NOT include the side in the pose name itself (no "Triangle Pose (right side)")
   - Each bilateral pose must be balanced with its corresponding opposite side
   - The sequence must have an equal number of poses on each side

## CRITICAL TIME REQUIREMENTS
- The full sequence MUST fill the entire {{duration}} minutes
- Include enough poses in each phase to reach the total duration
- For {{style}} yoga, aim for approximately {{target_pose_count}} poses in total
- The total duration of all poses MUST add up to at least {{duration_minutes}} minutes ({{duration_seconds}} seconds)
- Validate your sequence by calculating the total time of all poses before submitting

## AVAILABLE POSES
{{poseList}}

For bilateral poses, you MUST include both sides one after another. 

## CORRECT EXAMPLE
```json
[
  {
    "name": "Triangle Pose",
    "id": "123",
    "side": "right",
    "duration_seconds": 30
  },
  {
    "name": "Triangle Pose",
    "id": "123",
    "side": "left",
    "duration_seconds": 30
  }
]
```

## INCORRECT EXAMPLE
```json
[
  {
    "name": "Triangle Pose (right side)",
    "id": "123",
    "side": null,
    "duration_seconds": 30
  },
  {
    "name": "Triangle Pose (left side)",
    "id": "123",
    "side": null,
    "duration_seconds": 30
  }
]
```

This is REQUIRED for proper body balance and safety. 