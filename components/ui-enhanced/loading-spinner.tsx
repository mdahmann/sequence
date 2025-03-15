"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  color?: string
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = "medium",
  color = "currentColor",
  text,
  className = ""
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  }

  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1,
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={spinTransition}
        className={`${sizeMap[size]} rounded-full border-2 border-t-transparent`}
        style={{ 
          borderColor: `${color}33`,
          borderTopColor: color,
        }}
      />
    </div>
  )
} 