"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface EnhancedSliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  showTicks?: boolean
  tickInterval?: number
  formatValue?: (value: number) => string
  className?: string
}

export function EnhancedSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  showTicks = false,
  tickInterval = 10,
  formatValue = (value) => value.toString(),
  className = "",
}: EnhancedSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Update displayed value when actual value changes
  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  // Calculate the percentage position for the thumb
  const percentage = ((value - min) / (max - min)) * 100

  // Generate tick marks if enabled
  const ticks = []
  if (showTicks) {
    const numTicks = Math.floor((max - min) / tickInterval) + 1
    for (let i = 0; i < numTicks; i++) {
      const tickValue = min + i * tickInterval
      if (tickValue <= max) {
        const tickPosition = ((tickValue - min) / (max - min)) * 100
        ticks.push({
          value: tickValue,
          position: tickPosition,
        })
      }
    }
  }

  return (
    <div className={`relative py-4 ${className}`}>
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer"
        onClick={(e) => {
          if (sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect()
            const clickPosition = (e.clientX - rect.left) / rect.width
            const newValue = min + clickPosition * (max - min)
            const steppedValue = Math.round(newValue / step) * step
            const boundedValue = Math.max(min, Math.min(max, steppedValue))
            onChange(boundedValue)
          }
        }}
      >
        {/* Filled track */}
        <motion.div
          className="absolute h-full rounded-full bg-vibrant-blue"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        {/* Tick marks */}
        {showTicks && ticks.map((tick) => (
          <div
            key={tick.value}
            className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"
            style={{ left: `${tick.position}%` }}
          />
        ))}
        
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-vibrant-blue rounded-full shadow-md cursor-grab touch-none"
          style={{ left: `${percentage}%` }}
          initial={false}
          animate={{ 
            scale: isDragging ? 1.2 : 1,
            boxShadow: isDragging 
              ? "0 0 0 4px rgba(79, 70, 229, 0.2)" 
              : "0 1px 3px rgba(0, 0, 0, 0.2)"
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          drag="x"
          dragConstraints={sliderRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onDrag={(_, info) => {
            if (sliderRef.current) {
              const rect = sliderRef.current.getBoundingClientRect()
              const position = (info.point.x - rect.left) / rect.width
              const boundedPosition = Math.max(0, Math.min(1, position))
              const newValue = min + boundedPosition * (max - min)
              const steppedValue = Math.round(newValue / step) * step
              const boundedValue = Math.max(min, Math.min(max, steppedValue))
              setDisplayValue(boundedValue)
              onChange(boundedValue)
            }
          }}
        />
      </div>
      
      {/* Value display */}
      <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>{formatValue(min)}</div>
        <motion.div 
          className="font-semibold text-vibrant-blue"
          key={displayValue}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {formatValue(displayValue)}
        </motion.div>
        <div>{formatValue(max)}</div>
      </div>
    </div>
  )
} 