import { createServerSupabaseClient } from "@/lib/supabase"
import { PoseLibrary } from "./components/pose-library"
import type { Pose } from "@/types/pose"
import { PageContainer } from "@/components/page-container"

export default async function PoseLibraryPage() {
  // Get the supabase client with the async function
  const supabase = await createServerSupabaseClient()

  // Fetch all poses
  const { data: poses } = await supabase.from("poses").select("*").order("english_name", { ascending: true })
  
  // We need to handle the case where poses might be null
  const posesArray: Pose[] = poses || [];

  return (
    <PageContainer>
      <h1 className="text-4xl font-normal text-center mb-4">Find Your Flow</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        Explore our collection of yoga poses to create your perfect sequence.
      </p>

      <PoseLibrary initialPoses={posesArray} />
    </PageContainer>
  )
}

