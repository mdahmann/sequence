import { createServerSupabaseClient } from "@/lib/supabase"
import { PoseLibrary } from "./components/pose-library"
import type { Pose } from "@/types/pose"
import { PageContainer } from "@/components/page-container"
// app/pose-library/page.tsx
export const revalidate = 86400; // Revalidate every 24 hours

export default async function PoseLibraryPage() {
  const supabase = await createServerSupabaseClient();

  const { data: poses } = await supabase
    .from("poses")
    .select("*")
    .order("english_name", { ascending: true });
  
  return (
    <PageContainer>
      <h1 className="text-4xl font-normal text-center mb-4">Find Your Flow</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">
        Explore our collection of yoga poses to create your perfect sequence.
      </p>

      <PoseLibrary initialPoses={poses || []} />
    </PageContainer>
  );
}