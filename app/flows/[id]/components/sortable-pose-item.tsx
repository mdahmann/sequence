"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { GripVertical, Sparkles } from "lucide-react"
import { formatCategory } from "@/lib/utils"
import { useGenerateCues } from "@/hooks/use-generate-cues"
import { useToast } from "@/components/ui/use-toast"

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
  const [isEditingCues, setIsEditingCues] = useState(false)
  const [localCues, setLocalCues] = useState(cues)
  const { generateCues, isLoading } = useGenerateCues()
  const { toast } = useToast()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 1 : undefined,
  }

  const hasSideOption = pose.side_option === "both" || pose.side_option === "left_right"

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
        toast({
          title: "Teaching cues generated",
          description: "AI-generated teaching cues have been added to this pose.",
        })
      }
    } catch (error) {
      toast({
        title: "Error generating cues",
        description: "Failed to generate teaching cues. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="relative border-muted"
    >
      <CardContent className="pt-6 pb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 cursor-move" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="ml-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-2 items-start sm:items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium">{pose.english_name}</h3>
              {pose.sanskrit_name && <p className="text-sm text-muted-foreground">{pose.sanskrit_name}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {pose.category && <Badge variant="outline">{formatCategory(pose.category)}</Badge>}
              {pose.difficulty_level && <Badge variant="outline">{formatCategory(pose.difficulty_level)}</Badge>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-sm font-medium mb-1 block">Duration (seconds)</label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[duration]}
                    min={5}
                    max={300}
                    step={5}
                    className="flex-1"
                    onValueChange={handleDurationChange}
                  />
                  <span className="text-sm font-medium w-8 text-center">{duration}</span>
                </div>
              </div>

              {hasSideOption && (
                <div className="w-full sm:w-1/2">
                  <label className="text-sm font-medium mb-1 block">Side</label>
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
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Teaching Cues</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateCues}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    {isLoading ? "Generating..." : "Generate Cues"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingCues(!isEditingCues)}>
                    {isEditingCues ? "Done" : "Edit"}
                  </Button>
                </div>
              </div>

              {isEditingCues ? (
                <div className="space-y-2">
                  <Textarea
                    value={localCues}
                    onChange={(e) => handleCueChange(e.target.value)}
                    className="h-24 resize-none"
                    placeholder="Add teaching cues for this pose..."
                  />
                  <Button size="sm" onClick={saveCues}>Save Cues</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{cues || "No cues provided"}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

