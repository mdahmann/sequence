import { createServerSupabaseClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { FlowsList } from "./components/flows-list"
import { PageContainer } from "@/components/page-container"
import { cookies } from "next/headers"

export default async function FlowsPage() {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Flows page - Auth check:", session ? "Authenticated" : "Not authenticated")

  if (!session) {
    // Redirect to login if not authenticated
    redirect("/login?redirect=/flows")
  }

  // Fetch user's sequences
  const { data: sequences } = await supabase
    .from("sequences")
    .select(`
      *,
      sequence_poses (
        id,
        position,
        poses (
          id,
          english_name,
          sanskrit_name,
          category,
          difficulty_level
        )
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <PageContainer>
      <h1 className="text-4xl font-normal text-center mb-4">Your Flows</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">View and manage your saved yoga sequences.</p>

      <FlowsList sequences={sequences || []} />
    </PageContainer>
  )
}

