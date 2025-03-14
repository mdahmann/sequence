import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Pose } from "@/types/pose"
import { formatCategory } from "@/lib/utils"

interface RelatedPosesProps {
  pose: Pose
  relatedPoses: Pose[]
}

export function RelatedPoses({ pose, relatedPoses }: RelatedPosesProps) {
  // Group poses by their relationship to the main pose
  const preparatoryPoses = relatedPoses.filter((p) => pose.preparatory_poses && pose.preparatory_poses.includes(p.id))

  const counterPoses = relatedPoses.filter((p) => pose.counter_poses && pose.counter_poses.includes(p.id))

  const transitionPoses = relatedPoses.filter((p) => pose.transition_poses && pose.transition_poses.includes(p.id))

  return (
    <div>
      <h2 className="text-2xl font-serif font-normal mb-6">Related Poses</h2>

      {preparatoryPoses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-serif font-normal mb-4">Preparatory Poses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {preparatoryPoses.map((relatedPose) => (
              <RelatedPoseCard key={relatedPose.id} pose={relatedPose} />
            ))}
          </div>
        </div>
      )}

      {transitionPoses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-serif font-normal mb-4">Transition Poses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {transitionPoses.map((relatedPose) => (
              <RelatedPoseCard key={relatedPose.id} pose={relatedPose} />
            ))}
          </div>
        </div>
      )}

      {counterPoses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-serif font-normal mb-4">Counter Poses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {counterPoses.map((relatedPose) => (
              <RelatedPoseCard key={relatedPose.id} pose={relatedPose} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RelatedPoseCard({ pose }: { pose: Pose }) {
  return (
    <Link href={`/pose-library/${pose.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="border border-muted h-full">
        <CardContent className="p-4">
          <div className="flex flex-col">
            <div className="bg-muted/30 text-xs px-2 py-1 rounded-md inline-block mb-2 self-start">
              {formatCategory(pose.category)}
            </div>
            <h4 className="font-serif font-normal">{pose.english_name}</h4>
            <p className="text-sm text-muted-foreground italic">{pose.sanskrit_name}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

