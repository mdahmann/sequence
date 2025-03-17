"use client"

import React, { useState, useEffect, useRef } from "react"

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
  title?: string
}

export function EnhancedSlider({
  min,
  max,
  step = 15,
  value,
  onChange,
  showTicks = true,
  tickInterval = 15,
  formatValue = (value) => `${value} mins`,
  className = "",
  title,
}: EnhancedSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update internal value when prop changes
  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  // Handle clicking outside of input
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) && isEditing) {
        confirmInput()
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isEditing, inputValue])

  // Auto-focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Calculate percentage for positioning
  const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100))

  // Function to snap value to valid increments (15, 30, 45, 60)
  const snapToValidValue = (value: number): number => {
    if (value <= 15) return 15
    if (value <= 30) return 30
    if (value <= 45) return 45
    return 60
  }

  // Calculate value from position
  const calculateValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return currentValue
    
    const trackRect = trackRef.current.getBoundingClientRect()
    const position = (clientX - trackRect.left) / trackRect.width
    const boundedPosition = Math.max(0, Math.min(1, position))
    
    let newValue = min + boundedPosition * (max - min)
    // Snap to valid values (15, 30, 45, 60)
    return snapToValidValue(newValue)
  }

  // Handle mouse down on thumb
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    // Calculate initial position
    const startX = e.clientX
    const startValue = currentValue
    
    // Handle mouse move
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!trackRef.current) return
      
      const trackRect = trackRef.current.getBoundingClientRect()
      const trackWidth = trackRect.width
      
      // Calculate value change based on mouse movement
      const deltaX = moveEvent.clientX - startX
      const deltaRatio = deltaX / trackWidth
      const deltaValue = deltaRatio * (max - min)
      
      // Apply step and constraints
      let newValue = startValue + deltaValue
      newValue = snapToValidValue(newValue)
      
      setCurrentValue(newValue)
      onChange(newValue)
    }
    
    // Handle mouse up
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  // Handle touch events for mobile
  const handleThumbTouchStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scrolling
    setIsDragging(true)
    
    const touch = e.touches[0]
    const startX = touch.clientX
    const startValue = currentValue
    
    // Handle touch move
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!trackRef.current) return
      
      const touch = moveEvent.touches[0]
      const trackRect = trackRef.current.getBoundingClientRect()
      const trackWidth = trackRect.width
      
      // Calculate value change based on touch movement
      const deltaX = touch.clientX - startX
      const deltaRatio = deltaX / trackWidth
      const deltaValue = deltaRatio * (max - min)
      
      // Apply step and constraints
      let newValue = startValue + deltaValue
      newValue = snapToValidValue(newValue)
      
      setCurrentValue(newValue)
      onChange(newValue)
    }
    
    // Handle touch end
    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    // Add event listeners
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }
  
  // Handle track click
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current || e.target === thumbRef.current) return
    
    const newValue = calculateValueFromPosition(e.clientX)
    setCurrentValue(newValue)
    onChange(newValue)
  }
  
  // Handle direct editing
  const startEditing = () => {
    setInputValue(currentValue.toString())
    setIsEditing(true)
  }
  
  const confirmInput = () => {
    if (inputValue === "") {
      setIsEditing(false)
      return
    }
    
    let newValue = parseInt(inputValue, 10)
    if (isNaN(newValue)) {
      setIsEditing(false)
      return
    }
    
    // Ensure the value is within range
    newValue = Math.max(min, Math.min(max, newValue))
    // Snap to valid values
    newValue = snapToValidValue(newValue)
    
    setCurrentValue(newValue)
    onChange(newValue)
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      confirmInput()
    } else if (e.key === "Escape") {
      setIsEditing(false)
    }
  }
  
  // Generate tick marks
  const renderTicks = () => {
    if (!showTicks) return null
    
    const ticks = []
    const validValues = [15, 30, 45, 60]
    
    for (const tickValue of validValues) {
      if (tickValue >= min && tickValue <= max) {
        const tickPosition = ((tickValue - min) / (max - min)) * 100
        
        ticks.push(
          <div
            key={tickValue}
            className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full cursor-pointer"
            style={{ left: `${tickPosition}%` }}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentValue(tickValue)
              onChange(tickValue)
            }}
          />
        )
        
        // Add tick labels for clearer time delineation
        ticks.push(
          <div
            key={`label-${tickValue}`}
            className="absolute text-xs text-gray-500 dark:text-gray-400"
            style={{ 
              left: `${tickPosition}%`, 
              top: '12px',
              transform: 'translateX(-50%)'
            }}
          >
            {tickValue}
          </div>
        )
      }
    }
    
    return ticks
  }

  return (
    <div className={`relative ${className}`}>
      {/* Title and value */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-700 dark:text-gray-300">
          {title || "Duration (mins)"}
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={confirmInput}
            className="w-12 px-1 py-0.5 text-center text-sm font-medium bg-vibrant-blue/10 rounded border border-vibrant-blue"
          />
        ) : (
          <div 
            onClick={startEditing}
            className="cursor-pointer font-semibold text-vibrant-blue text-sm px-2 py-0.5 bg-vibrant-blue/10 rounded-md hover:bg-vibrant-blue/20 transition-colors"
          >
            {currentValue}
          </div>
        )}
      </div>
      
      {/* Slider track */}
      <div 
        ref={trackRef}
        className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Filled track */}
        <div
          className="absolute h-full rounded-full bg-vibrant-blue transition-all duration-100 ease-out"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Tick marks */}
        {renderTicks()}
        
        {/* Thumb */}
        <div
          ref={thumbRef}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-gray-800 border-2 border-vibrant-blue rounded-full shadow-md cursor-grab touch-none z-20 transition-transform duration-100 ${isDragging ? 'scale-125 shadow-lg' : ''}`}
          style={{ 
            left: `${percentage}%`,
            boxShadow: isDragging ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbTouchStart}
        />
      </div>
    </div>
  )
} 