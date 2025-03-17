"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SequencePose {
  id: string
  pose_id: string
  name: string
  sanskrit_name?: string
  duration_seconds: number
  position: number
  side?: "left" | "right" | "both" | null
  image_url?: string
}

interface SortablePoseItemProps {
  id: string
  pose: SequencePose
  index: number
  onDurationChange?: (id: string, duration: number) => void
  onSideToggle?: (id: string) => void
}

export function SortablePoseItem({ 
  id, 
  pose, 
  index, 
  onDurationChange,
  onSideToggle
}: SortablePoseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden w-full",
        isDragging ? "opacity-50 z-50 border-2 border-vibrant-blue" : "opacity-100",
        pose.side === "left" ? "border-l-4 border-l-blue-400" : "",
        pose.side === "right" ? "border-r-4 border-r-purple-400" : ""
      )}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        <div 
          className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center px-3 cursor-move"
          {...attributes}
          {...listeners}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        
        {/* Side Indicator */}
        {pose.side && (
          <div className={cn(
            "w-1.5 h-full",
            pose.side === "left" ? "bg-blue-400/20" : "bg-purple-400/20"
          )}></div>
        )}
        
        {/* Pose Info */}
        <div className={cn(
          "flex-grow p-4 flex justify-between items-center",
          pose.side === "left" ? "bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent" : "",
          pose.side === "right" ? "bg-gradient-to-l from-purple-50/50 to-transparent dark:from-purple-900/10 dark:to-transparent" : ""
        )}>
          <div className="flex items-center">
            {pose.side === "left" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 mr-3 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
            )}
            {pose.side === "right" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 mr-3 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
            <div>
              <div className="font-medium flex items-center">
                {pose.name}
                {pose.side && (
                  <button 
                    onClick={() => onSideToggle?.(pose.id)}
                    className={cn(
                      "ml-2 px-2 py-0.5 text-xs rounded-full",
                      pose.side === "left" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" 
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                    )}
                  >
                    {pose.side === "left" ? "Left" : "Right"}
                  </button>
                )}
              </div>
              {pose.sanskrit_name && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {pose.sanskrit_name}
                </div>
              )}
            </div>
          </div>
          
          {/* Duration Selector */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onDurationChange?.(pose.id, Math.max(5, pose.duration_seconds - 5))}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="w-16 text-center font-medium">
              {Math.floor(pose.duration_seconds / 60)}:{(pose.duration_seconds % 60).toString().padStart(2, '0')}
            </div>
            
            <button 
              onClick={() => onDurationChange?.(pose.id, pose.duration_seconds + 5)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 