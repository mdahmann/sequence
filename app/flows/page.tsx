import { createServerSupabaseClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { FlowsList } from "./components/flows-list"

export default async function FlowsPage() {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-normal text-center mb-4">Your Flows</h1>
      <p className="text-lg text-center text-muted-foreground mb-12">View and manage your saved yoga sequences.</p>

      <FlowsList sequences={sequences || []} />
    </div>
  )
}

