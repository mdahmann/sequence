"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, PanInfo } from "framer-motion"

// Simple debounce function implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  const [localValue, setLocalValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Update displayed value when actual value changes
  useEffect(() => {
    setDisplayValue(value)
    setLocalValue(value)
  }, [value])

  // Debounced onChange to prevent too many updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((newValue: number) => {
      onChange(newValue)
    }, 10),
    [onChange]
  )

  // Calculate the percentage position for the thumb
  const percentage = ((localValue - min) / (max - min)) * 100

  // Handle value calculation from position
  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return localValue
    
    const rect = trackRef.current.getBoundingClientRect()
    const position = (clientX - rect.left) / rect.width
    const boundedPosition = Math.max(0, Math.min(1, position))
    const newValue = min + boundedPosition * (max - min)
    const steppedValue = Math.round(newValue / step) * step
    return Math.max(min, Math.min(max, steppedValue))
  }, [localValue, max, min, step])

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

  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const newValue = calculateValueFromPosition(e.clientX)
    setDisplayValue(newValue)
    setLocalValue(newValue)
    onChange(newValue) // Immediate feedback for clicks
  }, [calculateValueFromPosition, onChange])

  // Handle thumb drag
  const handleDrag = useCallback((_: MouseEvent, info: PanInfo) => {
    const newValue = calculateValueFromPosition(info.point.x)
    setDisplayValue(newValue)
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }, [calculateValueFromPosition, debouncedOnChange])

  return (
    <div className={`relative py-4 ${className}`}>
      {/* Slider track */}
      <div 
        ref={sliderRef}
        className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer"
      >
        {/* Actual clickable track */}
        <div
          ref={trackRef}
          className="absolute inset-0 z-10"
          onClick={handleTrackClick}
        />
        
        {/* Filled track */}
        <motion.div
          className="absolute h-full rounded-full bg-vibrant-blue"
          style={{ width: `${percentage}%` }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
        />
        
        {/* Tick marks */}
        {showTicks && ticks.map((tick) => (
          <div
            key={tick.value}
            className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"
            style={{ left: `${tick.position}%` }}
            onClick={(e) => {
              e.stopPropagation()
              setDisplayValue(tick.value)
              setLocalValue(tick.value)
              onChange(tick.value)
            }}
          />
        ))}
        
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-vibrant-blue rounded-full shadow-md cursor-grab touch-none z-20"
          style={{ left: `${percentage}%` }}
          animate={{ 
            scale: isDragging ? 1.2 : 1,
            boxShadow: isDragging 
              ? "0 0 0 4px rgba(79, 70, 229, 0.2)" 
              : "0 1px 3px rgba(0, 0, 0, 0.2)"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30, 
            mass: 0.5 
          }}
          drag="x"
          dragConstraints={sliderRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => {
            setIsDragging(false)
            onChange(localValue) // Ensure final value is committed
          }}
          onDrag={handleDrag}
        />
      </div>
      
      {/* Value display */}
      <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>{formatValue(min)}</div>
        <motion.div 
          className="font-semibold text-vibrant-blue"
          key={displayValue}
          initial={{ opacity: 0.8, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.1 }}
        >
          {formatValue(displayValue)}
        </motion.div>
        <div>{formatValue(max)}</div>
      </div>
    </div>
  )
} 