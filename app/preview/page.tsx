import { createServerSupabaseClient } from "@/lib/supabase"
import { SequencePreview } from "./components/sequence-preview"
import { PageContainer } from "@/components/page-container"

export const dynamic = 'force-dynamic'

// Static example sequence to use when no real sequence exists in the database
const exampleSequence = {
  id: "example-sequence",
  title: "30-Minute Beginner Vinyasa Flow",
  description: "A gentle sequence focusing on foundational poses and smooth transitions, perfect for beginners.",
  duration: 30,
  difficulty_level: "beginner",
  style: "vinyasa_flow",
  focus_area: "full_body",
  is_ai_generated: true,
  created_at: new Date().toISOString(),
  sequence_poses: [
    {
      id: "pose-1",
      position: 0,
      duration: 60,
      side: null,
      cues: "Begin in a comfortable seated position. Close your eyes and take a few deep breaths to center yourself.",
      poses: {
        id: "seated-pose",
        english_name: "Easy Pose",
        sanskrit_name: "Sukhasana",
        category: "seated",
        difficulty_level: "beginner",
        side_option: null
      }
    },
    {
      id: "pose-2",
      position: 10,
      duration: 30,
      side: null,
      cues: "Inhale, reach your arms overhead. Exhale, bring your hands to your heart center.",
      poses: {
        id: "cat-cow",
        english_name: "Cat-Cow Stretch",
        sanskrit_name: "Marjaryasana-Bitilasana",
        category: "kneeling",
        difficulty_level: "beginner",
        side_option: null
      }
    },
    {
      id: "pose-3",
      position: 20,
      duration: 45,
      side: null,
      cues: "From all fours, tuck your toes and lift your hips up and back. Press your hands firmly into the mat.",
      poses: {
        id: "downward-dog",
        english_name: "Downward-Facing Dog",
        sanskrit_name: "Adho Mukha Svanasana",
        category: "standing",
        difficulty_level: "beginner",
        side_option: null
      }
    },
    {
      id: "pose-4",
      position: 30,
      duration: 30,
      side: "right",
      cues: "Step your right foot forward between your hands. Lower your back knee to the mat for more stability.",
      poses: {
        id: "low-lunge",
        english_name: "Low Lunge",
        sanskrit_name: "Anjaneyasana",
        category: "standing",
        difficulty_level: "beginner",
        side_option: "both"
      }
    },
    {
      id: "pose-5",
      position: 40,
      duration: 30,
      side: "left",
      cues: "Step your left foot forward between your hands. Keep your front knee aligned over your ankle.",
      poses: {
        id: "low-lunge",
        english_name: "Low Lunge",
        sanskrit_name: "Anjaneyasana",
        category: "standing",
        difficulty_level: "beginner",
        side_option: "both"
      }
    },
    {
      id: "pose-6",
      position: 50,
      duration: 45,
      side: null,
      cues: "Stand at the top of your mat, feet hip-width apart. Ground down through all four corners of your feet.",
      poses: {
        id: "mountain",
        english_name: "Mountain Pose",
        sanskrit_name: "Tadasana",
        category: "standing",
        difficulty_level: "beginner",
        side_option: null
      }
    },
    {
      id: "pose-7",
      position: 60,
      duration: 30,
      side: null,
      cues: "Lie on your back, extend your legs, and relax your arms by your sides. Let your body be heavy.",
      poses: {
        id: "corpse",
        english_name: "Corpse Pose",
        sanskrit_name: "Savasana",
        category: "supine",
        difficulty_level: "beginner",
        side_option: null
      }
    }
  ]
};

export default async function PreviewPage() {
  const supabase = createServerSupabaseClient()
  let sequence = null;

  try {
    // Fetch a sample sequence with its poses - getting the most recent AI-generated one
    const { data } = await supabase
      .from("sequences")
      .select(`
        *,
        sequence_poses (
          id,
          position,
          duration,
          side,
          cues,
          poses (*)
        )
      `)
      .eq("is_ai_generated", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    
    if (data) {
      sequence = data;
      // Sort the poses by position
      sequence.sequence_poses.sort((a: any, b: any) => a.position - b.position);
    }
  } catch (error) {
    console.error("Error fetching sequence:", error);
    // Fall back to example sequence if there's an error
  }

  // If no sequence was found in the database, use the example sequence
  if (!sequence) {
    sequence = exampleSequence;
  }

  return (
    <PageContainer maxWidth="default">
      <h1 className="text-3xl font-bold mb-2">{sequence.title}</h1>
      <p className="text-muted-foreground mb-8">{sequence.description}</p>

      <SequencePreview sequence={sequence} />
    </PageContainer>
  )
} 