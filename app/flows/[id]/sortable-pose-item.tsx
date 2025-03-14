"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GripVertical } from "lucide-react"
import type { Database } from "@/types/supabase"

type Pose = Database["public"]["Tables"]["poses"]["Row"]

interface SortablePoseItemProps {
  id: string
  pose: Pose
  cues: string
  side: string
  duration: number
  onCueChange: (cues: string) => void
  onSideChange: (side: string) => void
  onDurationChange: (duration: number) => void
}

export function SortablePoseItem({
  id,
  pose,
  cues,
  side,
  duration,
  onCueChange,
  onSideChange,
  onDurationChange,
}: SortablePoseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const formatCategory = (category: string | null) => {
    if (!category) return ""
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const hasSideOption = pose.side_option === "true"

  return (
    <Card ref={setNodeRef} style={style} className="border border-muted">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div {...attributes} {...listeners} className="cursor-grab p-2 self-center">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-grow">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
              <div>
                <h3 className="font-bold">{pose.english_name}</h3>
                <p className="text-sm text-muted-foreground italic">{pose.sanskrit_name}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-muted/30 px-2 py-1 rounded-md">{formatCategory(pose.category)}</span>
                <span className="bg-muted/30 px-2 py-1 rounded-md">{pose.difficulty_level}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor={`duration-${id}`} className="text-sm mb-1 block">
                  Duration (seconds)
                </Label>
                <Input
                  id={`duration-${id}`}
                  type="number"
                  min="5"
                  max="300"
                  value={duration}
                  onChange={(e) => onDurationChange(Number.parseInt(e.target.value) || 30)}
                  className="w-full"
                />
              </div>

              {hasSideOption && (
                <div>
                  <Label htmlFor={`side-${id}`} className="text-sm mb-1 block">
                    Side
                  </Label>
                  <Select value={side} onValueChange={onSideChange}>
                    <SelectTrigger id={`side-${id}`}>
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both sides</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor={`cues-${id}`} className="text-sm mb-1 block">
                Teaching Cues
              </Label>
              <Textarea
                id={`cues-${id}`}
                placeholder="Add teaching cues or notes for this pose..."
                value={cues}
                onChange={(e) => onCueChange(e.target.value)}
                className="min-h-[80px] w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

