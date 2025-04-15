# Sequence Generation Prompts

This document contains all prompts used in the sequence generation system, organized by their source files.

## lib/prompts/sequence-prompt.md
```markdown
# Yoga Sequence Generation Prompt

Generate a complete yoga sequence based on the following parameters:

## CRITICAL REQUIREMENTS
1. Use ONLY poses from the provided database list
2. EVERY pose MUST use the EXACT pose_id from the database (UUID format)
3. Do NOT use simplified names or IDs like "mountain_pose" or "downward_dog"
4. For bilateral poses, add both left and right sides
5. Total duration must be {{duration_minutes}} minutes ({{duration_seconds}} seconds)
6. Aim for {{target_pose_count}} poses total

## SEQUENCE PARAMETERS
- Style: {{style}}
- Focus: {{focus}}
- Difficulty: {{difficulty}}
- Duration: {{duration_minutes}} minutes
- Additional Notes: {{additionalNotes}}

## AVAILABLE POSES
{{poseList}}

## EXAMPLE FORMAT
```json
{
  "name": "Triangle Pose",
  "pose_id": "626a1c37-a02b-4f20-9f34-17c09b266557",  // MUST use exact UUID from database
  "side": "right",
  "duration_seconds": 30
}
```

## INCORRECT EXAMPLES (DO NOT USE):
```json
// ❌ WRONG - Using simplified IDs
{
  "name": "Mountain Pose",
  "pose_id": "mountain_pose",  // This is wrong
  "duration_seconds": 30
}

// ❌ WRONG - Using name as ID
{
  "name": "Downward Dog",
  "pose_id": "downward_dog",  // This is wrong
  "duration_seconds": 30
}

// ✅ CORRECT - Using database UUID
{
  "name": "Mountain Pose",
  "pose_id": "626a1c37-a02b-4f20-9f34-17c09b266557",  // This is correct
  "duration_seconds": 30
}
```

## CRITICAL VALIDATION CHECKS
Before submitting your response, verify:
1. Every pose has a valid pose_id from the database
2. Bilateral poses have both left and right sides
3. Total duration matches {{duration_seconds}} seconds
4. Pose count is appropriate for {{style}} style
5. All pose names match exactly with the database
```

## lib/prompts/sequence-validation.md
```markdown
# Sequence Validation Prompt

The current sequence is too short. Please expand it to fill the full duration while maintaining the same structure and flow.

## CRITICAL REQUIREMENTS
1. Use ONLY poses from the provided database list
2. EVERY pose MUST use the EXACT pose_id from the database (UUID format)
3. Do NOT use simplified names or IDs like "mountain_pose" or "downward_dog"
4. For bilateral poses, add both left and right sides
5. Total duration must be {{duration_minutes}} minutes ({{duration_seconds}} seconds)
6. Aim for {{target_pose_count}} poses total

## CURRENT SEQUENCE
{{currentSequence}}

## AVAILABLE POSES
{{poseList}}

## EXAMPLE FORMAT
```json
{
  "name": "Triangle Pose",
  "pose_id": "626a1c37-a02b-4f20-9f34-17c09b266557",  // MUST use exact UUID from database
  "side": "right",
  "duration_seconds": 30
}
```

## INCORRECT EXAMPLES (DO NOT USE):
```json
// ❌ WRONG - Using simplified IDs
{
  "name": "Mountain Pose",
  "pose_id": "mountain_pose",  // This is wrong
  "duration_seconds": 30
}

// ❌ WRONG - Using name as ID
{
  "name": "Downward Dog",
  "pose_id": "downward_dog",  // This is wrong
  "duration_seconds": 30
}

// ✅ CORRECT - Using database UUID
{
  "name": "Mountain Pose",
  "pose_id": "626a1c37-a02b-4f20-9f34-17c09b266557",  // This is correct
  "duration_seconds": 30
}
```

## CURRENT STATS
- Current poses: {{currentPoseCount}}
- Target poses: {{targetPoseCount}}
- Current duration: {{currentDurationSeconds}} seconds
- Target duration: {{duration_seconds}} seconds

Please expand the sequence to meet these requirements while maintaining the same structure and flow. Add more poses to fill the remaining time.
```

## lib/prompts/sequence-prompt-utils.ts
```typescript
// This file contains utility functions for generating prompts, not actual prompts
// Key functions:
// - generateSequencePrompt: Creates the main sequence generation prompt
// - generateValidationPrompt: Creates the validation prompt for expanding sequences
// - generatePoseList: Formats the list of available poses
// - calculateTargetPoseCount: Determines appropriate pose count based on style
```

## Notes on Prompt Structure
1. Both prompts emphasize:
   - Using exact pose IDs from database
   - Avoiding simplified IDs
   - Proper bilateral pose handling
   - Duration requirements

2. Key differences:
   - Main prompt focuses on initial sequence generation
   - Validation prompt focuses on expanding existing sequences
   - Validation prompt includes current sequence stats

3. Template variables used:
   - {{duration_minutes}}
   - {{duration_seconds}}
   - {{target_pose_count}}
   - {{style}}
   - {{focus}}
   - {{difficulty}}
   - {{additionalNotes}}
   - {{poseList}}
   - {{currentSequence}}
   - {{currentPoseCount}}
   - {{currentDurationSeconds}}
```

## Style-Specific Prompts and Requirements

### Vinyasa Flow
```markdown
## VINYASA FLOW REQUIREMENTS
1. Dynamic, flowing sequences with breath-synchronized movements
2. Each pose should flow into the next with clear transitions
3. Include vinyasa sequences between poses (plank → chaturanga → up dog → down dog)
4. Focus on sun salutations and standing poses
5. Maintain steady, rhythmic breathing patterns
6. Include both static holds and dynamic movements
7. Balance between strength and flexibility
8. Typical pose count: 20-30 poses for 60-minute class
9. Common transitions:
   - High plank → Chaturanga → Upward dog → Downward dog
   - Warrior 1 → Warrior 2 → Reverse Warrior
   - Triangle → Half moon → Revolved triangle
```

### Hatha
```markdown
## HATHA REQUIREMENTS
1. Slower, more deliberate pace with longer holds
2. Focus on alignment and proper form
3. Equal emphasis on strength and flexibility
4. Include both standing and seated poses
5. Balance between active and restorative poses
6. Clear instructions for breath work
7. Typical pose count: 15-20 poses for 60-minute class
8. Common sequences:
   - Mountain → Forward fold → Half lift → Forward fold
   - Warrior 1 → Warrior 2 → Side angle
   - Bridge → Wheel → Bridge
```

### Power Yoga
```markdown
## POWER YOGA REQUIREMENTS
1. High-energy, strength-focused practice
2. Include challenging variations and advanced poses
3. Emphasis on core work and arm balances
4. Dynamic transitions with vinyasa flows
5. Longer holds in challenging poses
6. Focus on building heat and intensity
7. Typical pose count: 25-35 poses for 60-minute class
8. Common elements:
   - Multiple vinyasa sequences
   - Advanced variations of basic poses
   - Core-focused sequences
   - Arm balance preparation
```

### Restorative
```markdown
## RESTORATIVE REQUIREMENTS
1. Gentle, relaxing practice with long holds
2. Focus on supported poses using props
3. Emphasis on relaxation and stress relief
4. Include gentle twists and forward folds
5. Minimal standing poses
6. Clear instructions for prop usage
7. Typical pose count: 8-12 poses for 60-minute class
8. Common elements:
   - Supported child's pose
   - Legs up the wall
   - Supported bridge
   - Gentle twists
   - Forward folds with props
```

### Yin Yoga
```markdown
## YIN YOGA REQUIREMENTS
1. Long holds (3-5 minutes) in passive poses
2. Focus on connective tissue and joints
3. Minimal muscle engagement
4. Emphasis on stillness and meditation
5. Include gentle backbends and forward folds
6. Clear instructions for finding edge
7. Typical pose count: 6-10 poses for 60-minute class
8. Common elements:
   - Dragon pose variations
   - Butterfly pose
   - Saddle pose
   - Melting heart
   - Sleeping swan
```

### Focus Area Requirements

#### Backbends
```markdown
## BACKBEND FOCUS REQUIREMENTS
1. Gradual progression from gentle to deeper backbends
2. Include preparatory poses
3. Balance between backbends and counterposes
4. Focus on thoracic spine mobility
5. Include both standing and supine backbends
6. Typical sequence:
   - Cat/cow warm-up
   - Cobra variations
   - Bridge pose
   - Wheel pose
   - Standing backbends
```

#### Hip Openers
```markdown
## HIP OPENER FOCUS REQUIREMENTS
1. Include both internal and external rotation
2. Balance between active and passive poses
3. Gradual progression in intensity
4. Include both standing and seated poses
5. Focus on proper alignment
6. Typical sequence:
   - Pigeon variations
   - Warrior 2
   - Triangle pose
   - Butterfly pose
   - Fire log pose
```

#### Core Strength
```markdown
## CORE STRENGTH FOCUS REQUIREMENTS
1. Include both dynamic and static core work
2. Balance between upper and lower core
3. Include plank variations
4. Focus on proper engagement
5. Include both traditional and creative core poses
6. Typical sequence:
   - Plank variations
   - Boat pose
   - Side plank
   - Dolphin pose
   - Forearm balance prep
```

#### Balance
```markdown
## BALANCE FOCUS REQUIREMENTS
1. Include both standing and arm balances
2. Progress from simple to complex balances
3. Include preparatory poses
4. Focus on drishti (gaze)
5. Include both static and dynamic balances
6. Typical sequence:
   - Tree pose
   - Warrior 3
   - Half moon
   - Crow pose
   - Handstand prep
```

### Difficulty Level Guidelines

#### Beginner
```markdown
## BEGINNER LEVEL REQUIREMENTS
1. Focus on basic poses and alignment
2. Clear, detailed instructions
3. Longer holds for learning
4. Minimal complex transitions
5. Emphasis on safety and proper form
6. Include modifications
7. Typical elements:
   - Basic standing poses
   - Simple seated poses
   - Gentle twists
   - Basic backbends
   - Supported poses
```

#### Intermediate
```markdown
## INTERMEDIATE LEVEL REQUIREMENTS
1. Include more complex poses
2. Faster transitions
3. Longer sequences
4. More challenging variations
5. Focus on refinement
6. Typical elements:
   - Advanced standing poses
   - Arm balance preparation
   - Inversions
   - Deeper backbends
   - Complex transitions
```

#### Advanced
```markdown
## ADVANCED LEVEL REQUIREMENTS
1. Include advanced poses and variations
2. Complex transitions and flows
3. Longer holds in challenging poses
4. Focus on subtle alignment
5. Include arm balances and inversions
6. Typical elements:
   - Advanced arm balances
   - Complex inversions
   - Deep backbends
   - Advanced transitions
   - Power poses
```
```

## lib/prompts/sequence-system-message.md
```markdown
You are a yoga sequence generator. Your task is to create yoga sequences based on the provided parameters and requirements. You must use ONLY the poses provided in the database list, and every pose must have a valid pose_id from that list. Do not use simplified names or IDs - use the exact UUIDs from the database.
```

## lib/prompts/general-principles.md
```markdown
# General Yoga Sequence Principles

## Core Principles
1. Always start with a proper warm-up
2. Progress from simple to complex poses
3. Include counterposes for challenging poses
4. End with appropriate cool-down poses
5. Maintain proper breathing throughout
6. Consider the natural flow of energy
7. Balance effort and ease
8. Include both static and dynamic elements
9. Consider the class theme and focus
10. Adapt to the specified difficulty level

## Sequence Structure
1. Opening/Meditation (2-5 minutes)
2. Warm-up (5-10 minutes)
3. Main practice (30-45 minutes)
4. Cool-down (5-10 minutes)
5. Savasana (5-10 minutes)

## Safety Guidelines
1. Include preparatory poses for challenging poses
2. Provide modifications for different levels
3. Include proper alignment cues
4. Consider contraindications
5. Balance between sides
6. Include rest periods when needed
7. End with appropriate cool-down
8. Provide clear transition instructions
9. Include breath guidance
10. Consider class level and experience
```

## lib/prompts/styles/vinyasa.md
```markdown
# Vinyasa Style Guidelines

## Core Characteristics
1. Breath-synchronized movement
2. Dynamic flowing sequences
3. Sun salutations as foundation
4. Standing pose emphasis
5. Vinyasa transitions between poses

## Sequence Structure
1. Opening meditation (2-3 minutes)
2. Sun salutations (5-10 minutes)
3. Standing poses (20-25 minutes)
4. Seated poses (10-15 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Common Elements
1. Multiple vinyasa flows
2. Standing pose variations
3. Arm balance preparation
4. Backbend sequences
5. Twisting poses
6. Forward folds
7. Inversion preparation
8. Core work
9. Hip openers
10. Balance poses

## Transition Guidelines
1. Use vinyasa between poses
2. Maintain breath rhythm
3. Clear movement cues
4. Smooth flow
5. Appropriate pacing
```

## lib/prompts/styles/hatha.md
```markdown
# Hatha Style Guidelines

## Core Characteristics
1. Slower, more deliberate pace
2. Longer pose holds
3. Focus on alignment
4. Equal emphasis on strength and flexibility
5. Clear breath work

## Sequence Structure
1. Opening meditation (3-5 minutes)
2. Gentle warm-up (5-7 minutes)
3. Standing poses (15-20 minutes)
4. Seated poses (15-20 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Common Elements
1. Basic standing poses
2. Seated forward folds
3. Gentle backbends
4. Simple twists
5. Basic inversions
6. Pranayama practice
7. Meditation elements
8. Alignment focus
9. Breath awareness
10. Restorative elements

## Teaching Guidelines
1. Clear alignment cues
2. Breath instruction
3. Longer holds
4. Detailed modifications
5. Focus on form
```

## lib/prompts/focus/backbends.md
```markdown
# Backbend Focus Guidelines

## Core Principles
1. Gradual progression
2. Proper warm-up
3. Counterposes
4. Breath awareness
5. Safe alignment

## Sequence Structure
1. Gentle warm-up (5-7 minutes)
2. Preparatory poses (10-15 minutes)
3. Main backbend practice (20-25 minutes)
4. Counterposes (5-7 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Essential Elements
1. Cat/cow warm-up
2. Cobra variations
3. Bridge pose
4. Wheel pose
5. Standing backbends
6. Camel pose
7. Bow pose
8. Locust variations
9. Fish pose
10. Supported backbends

## Safety Guidelines
1. Warm up properly
2. Include counterposes
3. Focus on thoracic spine
4. Maintain breath
5. Listen to body
6. Use props when needed
7. Avoid over-arching
8. Include rest periods
9. Consider level
10. End gently
```

## lib/prompts/focus/hip-openers.md
```markdown
# Hip Opener Focus Guidelines

## Core Principles
1. Balance internal/external rotation
2. Gradual progression
3. Proper alignment
4. Breath awareness
5. Safe practice

## Sequence Structure
1. Gentle warm-up (5-7 minutes)
2. Standing hip openers (15-20 minutes)
3. Seated hip openers (15-20 minutes)
4. Deep hip work (10-15 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Essential Elements
1. Warrior poses
2. Triangle pose
3. Pigeon variations
4. Butterfly pose
5. Fire log pose
6. Cow face pose
7. Lizard pose
8. Frog pose
9. Reclined pigeon
10. Supine twists

## Safety Guidelines
1. Warm up properly
2. Listen to body
3. Use props when needed
4. Maintain alignment
5. Include rest periods
6. Consider level
7. Avoid over-stretching
8. Balance both sides
9. End gently
10. Include counterposes
```

## lib/prompts/difficulty/beginner.md
```markdown
# Beginner Level Guidelines

## Core Principles
1. Focus on basics
2. Clear instructions
3. Safe practice
4. Proper alignment
5. Gentle progression

## Sequence Structure
1. Longer warm-up (7-10 minutes)
2. Basic standing poses (15-20 minutes)
3. Simple seated poses (15-20 minutes)
4. Gentle cool-down (7-10 minutes)
5. Longer savasana (7-10 minutes)

## Essential Elements
1. Basic standing poses
2. Simple seated poses
3. Gentle twists
4. Basic backbends
5. Supported poses
6. Clear modifications
7. Detailed cues
8. Longer holds
9. Rest periods
10. Simple transitions

## Teaching Guidelines
1. Clear, detailed instructions
2. Multiple modifications
3. Focus on safety
4. Gentle pacing
5. Regular check-ins
6. Props usage
7. Simple language
8. Repetition of basics
9. Encouragement
10. Patience
```

## lib/prompts/difficulty/intermediate.md
```markdown
# Intermediate Level Guidelines

## Core Principles
1. Deeper practice
2. More complex poses
3. Refined alignment
4. Stronger focus
5. Balanced challenge

## Sequence Structure
1. Dynamic warm-up (5-7 minutes)
2. Standing poses (20-25 minutes)
3. Seated poses (15-20 minutes)
4. Advanced work (10-15 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Essential Elements
1. Advanced standing poses
2. Arm balance preparation
3. Inversions
4. Deeper backbends
5. Complex transitions
6. Advanced twists
7. Balance poses
8. Core work
9. Hip openers
10. Advanced variations

## Teaching Guidelines
1. Refined cues
2. Advanced modifications
3. Focus on subtlety
4. Faster transitions
5. Deeper holds
6. Challenge appropriately
7. Maintain safety
8. Include options
9. Progressive complexity
10. Balanced intensity
```

## lib/prompts/difficulty/advanced.md
```markdown
# Advanced Level Guidelines

## Core Principles
1. Complex sequences
2. Advanced poses
3. Subtle alignment
4. Deep focus
5. Strong challenge

## Sequence Structure
1. Dynamic warm-up (5-7 minutes)
2. Complex standing poses (20-25 minutes)
3. Advanced seated work (15-20 minutes)
4. Peak poses (10-15 minutes)
5. Cool-down (5-7 minutes)
6. Savasana (5-7 minutes)

## Essential Elements
1. Advanced arm balances
2. Complex inversions
3. Deep backbends
4. Advanced transitions
5. Power poses
6. Advanced twists
7. Complex balances
8. Advanced core work
9. Deep hip openers
10. Peak pose variations

## Teaching Guidelines
1. Advanced cues
2. Complex modifications
3. Focus on subtlety
4. Dynamic transitions
5. Longer holds
6. Strong challenge
7. Maintain safety
8. Include options
9. Progressive complexity
10. Balanced intensity
```