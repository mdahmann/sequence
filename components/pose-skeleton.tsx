"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PoseSkeletonProps {
  count?: number
  className?: string
}

export function PoseSkeleton({ count = 1, className }: PoseSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-3 bg-warm-white/40 dark:bg-deep-charcoal-light/40 rounded-lg p-3 border border-gray-200 dark:border-gray-700 animate-pulse",
            className
          )}
        >
          {/* Pose Image Skeleton */}
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
          
          {/* Pose Info Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          
          {/* Duration Skeleton */}
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
        </div>
      ))}
    </>
  )
}

export function PhaseHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  )
}

export function SequenceSkeletonView() {
  // Define skeleton phases with varying pose counts
  const skeletonPhases = [
    { name: "Warm Up", count: 4 },
    { name: "Standing Sequence", count: 6 },
    { name: "Peak Poses", count: 3 },
    { name: "Floor Sequence", count: 4 },
    { name: "Cool Down", count: 3 },
  ]

  return (
    <div className="space-y-8 pb-8">
      {skeletonPhases.map((phase, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white/80 dark:bg-deep-charcoal/80 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <PhaseHeaderSkeleton />
          <div className="space-y-2 mt-4">
            <PoseSkeleton count={phase.count} />
          </div>
        </motion.div>
      ))}
    </div>
  )
} 