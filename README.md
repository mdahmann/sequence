# Sequence - AI-Powered Yoga Sequence Builder

Sequence is a modern web application that helps yoga teachers and practitioners create flowing, intuitive yoga sequences with mindful transitions and balanced energy.

## Features

### AI-Powered Sequence Generation

- Generate complete yoga sequences based on duration, difficulty, style, and focus area
- Intelligent pose selection and sequencing following yoga principles
- Customizable sequences with the ability to add, remove, and reorder poses

### Teaching Cues Generation

- AI-generated teaching cues for each pose
- Customizable cues with manual editing
- Side-specific cues for poses with left/right variations

### Sequence Management

- Save and organize your sequences
- Edit and customize sequences
- Share sequences with others

## Technology Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI API (GPT-4)

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- OpenAI API key

### Environment Variables

Create a `.env` file with the following variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Site URL (for API routes)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## API Endpoints

### Generate Teaching Cues

`POST /api/generate-cues`

Generate teaching cues for a specific pose.

**Request Body:**
```json
{
  "poseId": "pose-uuid",
  "side": "left|right|",
  "existingCues": "Optional existing cues to refine"
}
```

**Response:**
```json
{
  "cues": "Generated teaching cues for the pose"
}
```

### Generate Sequence

`POST /api/generate-sequence`

Generate a complete yoga sequence.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "duration": 30,
  "difficulty": "beginner|intermediate|advanced",
  "style": "vinyasa|hatha|yin|restorative|power",
  "focusArea": "hip_openers|backbends|twists|forward_bends|arm_balances|inversions|core_strength|balance",
  "additionalNotes": "Optional notes for customization"
}
```

**Response:**
```json
{
  "sequence": {
    "id": "sequence-uuid",
    "title": "Sequence title",
    "description": "Sequence description",
    "...": "Other sequence properties"
  }
}
```

## License

MIT 