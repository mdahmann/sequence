import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import type { Pose } from "@/types/pose"
import { formatCategory } from "@/lib/utils"

interface PoseDetailProps {
  pose: Pose
}

export function PoseDetail({ pose }: PoseDetailProps) {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link href="/pose-library" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pose Library
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {pose.image_url ? (
            <img
              src={pose.image_url || "/placeholder.svg"}
              alt={pose.english_name}
              className="w-full rounded-lg object-cover aspect-square"
            />
          ) : (
            <div className="w-full rounded-lg bg-muted/30 flex items-center justify-center aspect-square">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">
              {formatCategory(pose.category)}
            </div>
            <div className="bg-muted/30 px-3 py-1 rounded-md text-sm">{formatCategory(pose.difficulty_level)}</div>
            {pose.side_option === "true" && (
              <div className="bg-muted/30 px-3 py-1 rounded-md text-sm">Has side variations</div>
            )}
          </div>

          <h1 className="text-3xl font-normal mb-1">{pose.english_name}</h1>
          <h2 className="text-xl font-serif font-normal text-muted-foreground mb-6 italic">
            {pose.sanskrit_name}
            {pose.translation_name && ` (${pose.translation_name})`}
          </h2>

          {pose.description && (
            <div className="mb-6">
              <h3 className="text-lg font-serif font-normal mb-2">Description</h3>
              <p className="text-muted-foreground">{pose.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pose.benefits && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-serif font-normal mb-2">Benefits</h3>
                  <p className="text-muted-foreground">{pose.benefits}</p>
                </CardContent>
              </Card>
            )}

            {pose.contraindications && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-serif font-normal mb-2">Contraindications</h3>
                  <p className="text-muted-foreground">{pose.contraindications}</p>
                </CardContent>
              </Card>
            )}

            {pose.breath_instructions && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-serif font-normal mb-2">Breath Instructions</h3>
                  <p className="text-muted-foreground">{pose.breath_instructions}</p>
                </CardContent>
              </Card>
            )}

            {pose.drishti && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-serif font-normal mb-2">Drishti (Gaze)</h3>
                  <p className="text-muted-foreground">{pose.drishti}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {pose.sequencing_notes && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-serif font-normal mb-2">Sequencing Notes</h3>
                <p className="text-muted-foreground">{pose.sequencing_notes}</p>
              </CardContent>
            </Card>
          )}

          {pose.props_needed && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-serif font-normal mb-2">Props Needed</h3>
                <p className="text-muted-foreground">{pose.props_needed}</p>
              </CardContent>
            </Card>
          )}

          {pose.anatomical_focus && pose.anatomical_focus.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-serif font-normal mb-2">Anatomical Focus</h3>
              <div className="flex flex-wrap gap-2">
                {pose.anatomical_focus.map((focus, index) => (
                  <div key={index} className="bg-muted/30 px-3 py-1 rounded-md text-sm">
                    {focus}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pose.tags && pose.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-serif font-normal mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {pose.tags.map((tag, index) => (
                  <div key={index} className="bg-muted/30 px-3 py-1 rounded-md text-sm">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

