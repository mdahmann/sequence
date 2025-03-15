"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PoseCard from "./pose-card"

export interface Phase {
  id: string
  name: string
  description?: string
  poses: Pose[]
  duration?: number
}

export interface Pose {
  id: string
  name: string
  sanskritName?: string
  side?: 'left' | 'right' | 'both'
  duration?: string
  cues?: string[]
  category?: string
  difficulty?: string
  imageUrl?: string
  isBilateral?: boolean
}

export interface PhaseDisplayProps {
  phases: Phase[]
  onPoseRemove?: (phaseId: string, poseId: string) => void
  onPoseDragEnd?: (
    sourcePhaseId: string,
    sourcePoseId: string,
    targetPhaseId: string,
    targetIndex: number
  ) => void
  onChangePoseSide?: (phaseId: string, poseId: string, side: 'left' | 'right' | 'both') => void
  className?: string
}

export const PhaseDisplay = ({
  phases,
  onPoseRemove,
  onPoseDragEnd,
  onChangePoseSide,
  className,
}: PhaseDisplayProps) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    Object.fromEntries(phases.map(phase => [phase.id, true]))
  )
  const [draggedPose, setDraggedPose] = useState<{
    phaseId: string
    poseId: string
  } | null>(null)

  // Toggle phase expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }))
  }

  // Format duration for display
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0 min"
    const minutes = Math.round(seconds / 60)
    return `${minutes} min`
  }

  // Handle drag start
  const handleDragStart = (phaseId: string, poseId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedPose({ phaseId, poseId })
    e.dataTransfer.setData('text/plain', JSON.stringify({ phaseId, poseId }))
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedPose(null)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-muted/20')
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-muted/20')
  }

  // Handle drop
  const handleDrop = (targetPhaseId: string, targetIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-muted/20')

    if (!draggedPose || !onPoseDragEnd) return

    const { phaseId: sourcePhaseId, poseId: sourcePoseId } = draggedPose
    onPoseDragEnd(sourcePhaseId, sourcePoseId, targetPhaseId, targetIndex)
  }

  return (
    <div className={cn("space-y-6", className)}>
      <AnimatePresence>
        {phases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: phaseIndex * 0.1 }}
          >
            <Card className="border-muted overflow-hidden">
              <CardHeader className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 mr-2 -ml-2 text-soft-grey"
                      onClick={() => togglePhase(phase.id)}
                    >
                      {expandedPhases[phase.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {phase.name}
                      </CardTitle>
                      {phase.description && (
                        <p className="text-xs text-soft-grey mt-0.5">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 h-5 border-muted-beige text-soft-grey"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDuration(phase.duration)}
                  </Badge>
                </div>
              </CardHeader>

              <AnimatePresence>
                {expandedPhases[phase.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="px-4 pt-0 pb-4">
                      <div className="space-y-3">
                        {phase.poses.length === 0 ? (
                          <div
                            className="border border-dashed border-muted rounded-md p-4 text-center text-soft-grey text-sm"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop(phase.id, 0)}
                          >
                            Drag poses here
                          </div>
                        ) : (
                          phase.poses.map((pose, poseIndex) => (
                            <div
                              key={pose.id}
                              className="relative"
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop(phase.id, poseIndex)}
                            >
                              <PoseCard
                                name={pose.name}
                                sanskritName={pose.sanskritName}
                                side={pose.side}
                                duration={pose.duration}
                                cues={pose.cues}
                                category={pose.category}
                                imageUrl={pose.imageUrl}
                                isBilateral={pose.isBilateral}
                                onRemove={
                                  onPoseRemove
                                    ? () => onPoseRemove(phase.id, pose.id)
                                    : undefined
                                }
                                onChangeSide={
                                  onChangePoseSide
                                    ? (side) => onChangePoseSide(phase.id, pose.id, side)
                                    : undefined
                                }
                                isDraggable={true}
                                onDragStart={handleDragStart(phase.id, pose.id)}
                                onDragEnd={handleDragEnd}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default PhaseDisplay 