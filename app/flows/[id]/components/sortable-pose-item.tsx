"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { GripVertical, Sparkles } from "lucide-react"
import { formatCategory } from "@/lib/utils"
import { useGenerateCues } from "@/hooks/use-generate-cues"

interface Pose {
  id: string
  english_name: string
  sanskrit_name: string | null
  category: string | null
  difficulty_level: string | null
  side_option: string | null
}

interface SortablePoseItemProps {
  id: string
  pose: Pose
  cues: string
  side: string
  duration: number
  onCueChange: (cues: string) => void
  onSideChange: (side: string) => void
  onDurationChange: (duration: number) => void
  isEditable?: boolean
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
  isEditable = true,
}: SortablePoseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [isEditingCues, setIsEditingCues] = useState(false)
  const [localCues, setLocalCues] = useState(cues)
  const { generateCues, isLoading: isGeneratingCues } = useGenerateCues()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleCueChange = (value: string) => {
    setLocalCues(value)
  }

  const saveCues = () => {
    onCueChange(localCues)
    setIsEditingCues(false)
  }

  const handleDurationChange = (value: number[]) => {
    onDurationChange(value[0])
  }

  const handleGenerateCues = async () => {
    try {
      const generatedCues = await generateCues({
        poseId: pose.id,
        side,
        existingCues: localCues,
      })
      if (generatedCues) {
        setLocalCues(generatedCues)
        onCueChange(generatedCues)
      }
    } catch (error) {
      console.error("Error generating cues:", error)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="border">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-lg">{pose.english_name}</h3>
              {pose.sanskrit_name && <p className="text-sm text-muted-foreground">{pose.sanskrit_name}</p>}
            </div>
            <div className="flex space-x-1">
              {pose.category && <Badge variant="outline">{formatCategory(pose.category)}</Badge>}
              {pose.difficulty_level && <Badge variant="outline">{formatCategory(pose.difficulty_level)}</Badge>}
            </div>
            {isEditable && (
              <div
                {...attributes}
                {...listeners}
                className="absolute top-2 right-2 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Duration slider */}
          {isEditable ? (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm text-muted-foreground">{duration} seconds</span>
              </div>
              <Slider
                value={[duration]}
                min={5}
                max={120}
                step={5}
                onValueChange={handleDurationChange}
              />
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm text-muted-foreground">{duration} seconds</span>
              </div>
            </div>
          )}

          {/* Side selection */}
          {pose.side_option && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2">Side</label>
              {isEditable ? (
                <Select value={side} onValueChange={onSideChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Both/Center</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">{side || "Both/Center"}</div>
              )}
            </div>
          )}

          {/* Cues */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Cues</label>
              {isEditable && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingCues(!isEditingCues)}
                  >
                    {isEditingCues ? "Cancel" : "Edit"}
                  </Button>
                  {isEditingCues && (
                    <Button variant="ghost" size="sm" onClick={saveCues}>
                      Save
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateCues}
                    disabled={isGeneratingCues}
                  >
                    {isGeneratingCues ? "Generating..." : "Generate"}
                    <Sparkles className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {isEditingCues && isEditable ? (
              <Textarea
                value={localCues}
                onChange={(e) => handleCueChange(e.target.value)}
                placeholder="Enter cues for this pose..."
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{cues || "No cues provided."}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

