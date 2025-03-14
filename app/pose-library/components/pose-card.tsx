import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Pose } from "@/types/pose"
import { formatCategory } from "@/lib/utils"

interface PoseCardProps {
  pose: Pose
}

export function PoseCard({ pose }: PoseCardProps) {
  return (
    <Link href={`/pose-library/${pose.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="border border-muted h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="bg-muted/30 text-xs px-2 py-1 rounded-md inline-block mb-2">
                {formatCategory(pose.category)}
              </div>
              <h3 className="font-serif font-normal">{pose.english_name}</h3>
              <p className="text-sm text-muted-foreground italic">{pose.sanskrit_name}</p>
            </div>
            <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
              {formatCategory(pose.difficulty_level)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

