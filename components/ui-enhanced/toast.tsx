"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: "default" | "success" | "error" | "info"
  duration?: number
  onClose: (id: string) => void
  className?: string
}

export function EnhancedToast({
  id,
  title,
  description,
  variant = "default",
  duration = 5000,
  onClose,
  className
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  
  // Handle auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)
    
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / duration) * 100
        return newProgress < 0 ? 0 : newProgress
      })
    }, 100)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [duration])
  
  // Handle animation complete
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose(id)
    }
  }
  
  // Variant styling
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          background: "bg-green-50 border-green-200",
          progressColor: "bg-green-500"
        }
      case "error":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          background: "bg-red-50 border-red-200",
          progressColor: "bg-red-500"
        }
      case "info":
        return {
          icon: <InfoIcon className="h-5 w-5 text-blue-500" />,
          background: "bg-blue-50 border-blue-200",
          progressColor: "bg-blue-500"
        }
      default:
        return {
          icon: <InfoIcon className="h-5 w-5 text-vibrant-blue" />,
          background: "bg-warm-white border-muted-beige",
          progressColor: "bg-vibrant-blue"
        }
    }
  }
  
  const variantStyles = getVariantStyles()
  
  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative overflow-hidden rounded-lg border p-4 shadow-md",
            variantStyles.background,
            className
          )}
        >
          <div className="flex">
            <div className="flex-shrink-0 mr-3">
              {variantStyles.icon}
            </div>
            <div className="flex-1 mr-2">
              <h4 className="text-sm font-semibold">{title}</h4>
              {description && (
                <p className="text-xs mt-1 text-muted-foreground">{description}</p>
              )}
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          <motion.div
            className={cn("absolute bottom-0 left-0 h-1", variantStyles.progressColor)}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
} 