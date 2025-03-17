import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { PoseDetail } from "./components/pose-detail"
import { RelatedPoses } from "./components/related-poses"
import type { Pose } from "@/types/pose"
import { PageContainer } from "@/components/page-container"

export default async function PoseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const poseId = params.id

  // Fetch the pose details
  const { data: pose, error } = await supabase.from("poses").select("*").eq("id", poseId).single()

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
    <PageContainer>
      <PoseDetail pose={pose as Pose} />

      {relatedPoses.length > 0 && <RelatedPoses pose={pose as Pose} relatedPoses={relatedPoses} />}
    </PageContainer>
  )
}

