import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { PoseDetail } from "./components/pose-detail"
import { RelatedPoses } from "./components/related-poses"
import type { Pose } from "@/types/pose"

export default async function PoseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Fetch the pose details
  const { data: pose, error } = await supabase.from("poses").select("*").eq("id", params.id).single()

  if (error || !pose) {
    notFound()
  }

  // Fetch related poses (preparatory, counter, and transition poses)
  const relatedPoseIds = [
    ...(pose.preparatory_poses || []),
    ...(pose.counter_poses || []),
    ...(pose.transition_poses || []),
  ].filter(Boolean)

  let relatedPoses: Pose[] = []

  if (relatedPoseIds.length > 0) {
    const { data: related } = await supabase.from("poses").select("*").in("id", relatedPoseIds)
    relatedPoses = (related as Pose[]) || []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PoseDetail pose={pose as Pose} />

      {relatedPoses.length > 0 && <RelatedPoses pose={pose as Pose} relatedPoses={relatedPoses} />}
    </div>
  )
}

