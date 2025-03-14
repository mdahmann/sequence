import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log("Creating database tables...")

  const { error } = await supabase.from("poses").select("id").limit(1)

  if (error && error.code === "42P01") {
    // Table doesn't exist
    console.log("Tables do not exist. Creating them...")

    // Create tables using SQL query
    const { error: sqlError } = await supabase.sql(`
      -- Create poses table
      CREATE TABLE IF NOT EXISTS poses (
        id UUID PRIMARY KEY,
        english_name TEXT NOT NULL,
        sanskrit_name TEXT,
        translation_name TEXT,
        category TEXT,
        difficulty_level TEXT,
        description TEXT,
        benefits TEXT,
        side_option TEXT,
        alternative_english_name TEXT,
        contraindications TEXT,
        props_needed TEXT,
        drishti TEXT,
        breath_instructions TEXT,
        sequencing_notes TEXT,
        preparatory_poses JSONB,
        transition_poses JSONB,
        counter_poses JSONB,
        hold_duration TEXT,
        pose_variations JSONB,
        anatomical_focus JSONB,
        chakra_association TEXT,
        tags JSONB,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create sequences table
      CREATE TABLE IF NOT EXISTS sequences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        difficulty_level TEXT,
        style TEXT,
        focus_area TEXT,
        peak_pose UUID REFERENCES poses(id),
        is_ai_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create sequence_poses table
      CREATE TABLE IF NOT EXISTS sequence_poses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
        pose_id UUID NOT NULL REFERENCES poses(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        duration INTEGER,
        side TEXT,
        cues TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(sequence_id, position)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_poses_category ON poses(category);
      CREATE INDEX IF NOT EXISTS idx_poses_difficulty ON poses(difficulty_level);
      CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);
      CREATE INDEX IF NOT EXISTS idx_sequence_poses_sequence_id ON sequence_poses(sequence_id);
    `)

    if (sqlError) {
      console.error("Error creating tables:", sqlError)
    } else {
      console.log("Tables created successfully!")
    }
  } else {
    console.log("Tables already exist.")
  }
}

createTables()

