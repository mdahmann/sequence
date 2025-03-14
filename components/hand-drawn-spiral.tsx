"use client"

import type React from "react"

interface HandDrawnSpiralProps {
  className?: string
  width?: number
  height?: number
  strokeWidth?: number
  color?: string
  animate?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const HandDrawnSpiral: React.FC<HandDrawnSpiralProps> = ({
  className = "",
  width = 24,
  height = 24,
  strokeWidth = 1.5,
  color = "currentColor",
  animate = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Calculate the total length of the main spiral path
  // This is an approximation - in a real app you might want to measure it
  const pathLength = 200

  // Define the animation styles
  const animationStyles = animate
    ? {
        strokeDasharray: `${pathLength}`,
        strokeDashoffset: `${pathLength}`,
        animation: "drawSpiral 2.5s ease-in-out forwards",
      }
    : {
        strokeDasharray: "1,0",
      }

  // Define the animation styles for the small details
  const detailAnimationStyles = animate
    ? {
        strokeDasharray: "20",
        strokeDashoffset: "20",
        animation: "drawSpiral 0.8s ease-in-out 2s forwards",
      }
    : {
        strokeDasharray: "1,0",
      }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Hand-drawn spiral with organic, slightly irregular path */}
      <path
        d="M12,12 
        C12,10.3 13.2,9.3 14.7,9.3 
        C16.4,9.3 17.5,10.7 17.5,12.1 
        C17.5,14.2 15.9,15.7 13.7,15.6 
        C11.2,15.5 9.5,13.7 9.5,11.5 
        C9.5,8.9 11.8,6.9 14.4,7.0 
        C17.3,7.1 19.5,9.6 19.4,12.5 
        C19.3,15.8 16.4,18.4 13.0,18.3 
        C9.1,18.2 6.0,15.0 6.1,11.3 
        C6.2,7.2 9.8,3.9 14.0,4.0 
        C18.6,4.1 22.1,7.9 22.0,12.6 
        C21.9,17.6 17.7,21.7 12.7,21.6 
        C7.3,21.5 2.9,17.0 3.0,11.6 
        C3.1,5.9 7.9,1.3 13.7,1.4"
        style={animationStyles}
      />
      {/* Add some small irregularities to make it look hand-drawn */}
      <path d="M13.5,3.2 C13.7,3.0 13.9,2.8 14.1,2.6" style={detailAnimationStyles} />
      <path d="M17.8,10.5 C18.0,10.3 18.2,10.1 18.4,9.9" style={detailAnimationStyles} />
      <path d="M8.2,14.5 C8.0,14.7 7.8,14.9 7.6,15.1" style={detailAnimationStyles} />
    </svg>
  )
}

export default HandDrawnSpiral

