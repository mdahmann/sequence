"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, Info, MoreHorizontal, Trash2, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface PoseCardProps {
  name: string
  sanskritName?: string
  side?: 'left' | 'right' | 'both'
  duration?: string
  cues?: string[]
  category?: string
  difficulty?: string
  imageUrl?: string
  isBilateral?: boolean
  onRemove?: () => void
  onChangeSide?: (side: 'left' | 'right' | 'both') => void
  onChangeDuration?: (duration: string) => void
  onEdit?: () => void
  isDraggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  className?: string
}

export const PoseCard = ({
  name,
  sanskritName,
  side = 'both',
  duration = '5 breaths',
  cues = [],
  category,
  difficulty,
  imageUrl,
  isBilateral = false,
  onRemove,
  onChangeSide,
  onChangeDuration,
  onEdit,
  isDraggable = false,
  onDragStart,
  onDragEnd,
  className,
}: PoseCardProps) => {
  // Handle side change
  const handleSideChange = (newSide: 'left' | 'right' | 'both') => {
    if (onChangeSide) {
      onChangeSide(newSide);
    }
  };

  // Render side selector for bilateral poses
  const renderSideSelector = () => {
    if (!isBilateral) return null;
    
    return (
      <div className="flex items-center space-x-1 mt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full",
                  side === 'left' ? 'bg-vibrant-blue text-white' : 'bg-transparent text-soft-grey'
                )}
                onClick={() => handleSideChange('left')}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Left side</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full",
                  side === 'both' ? 'bg-vibrant-blue text-white' : 'bg-transparent text-soft-grey'
                )}
                onClick={() => handleSideChange('both')}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Both sides</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded-full",
                  side === 'right' ? 'bg-vibrant-blue text-white' : 'bg-transparent text-soft-grey'
                )}
                onClick={() => handleSideChange('right')}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Right side</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn("will-change-transform", className)}
    >
      <Card
        className={cn(
          "overflow-hidden border-muted bg-warm-white/80 backdrop-blur-sm hover:border-vibrant-blue/20 transition-all duration-300",
          isDraggable && "cursor-grab active:cursor-grabbing"
        )}
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Image container */}
            {imageUrl ? (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 flex-shrink-0 bg-muted-beige/30 rounded-md flex items-center justify-center">
                <span className="text-soft-grey text-xs">No image</span>
              </div>
            )}

            {/* Content container */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{name}</h3>
                  {sanskritName && (
                    <p className="text-xs text-soft-grey italic">
                      {sanskritName}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-muted-beige text-soft-grey">
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {duration}
                    </Badge>
                    
                    {category && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-muted-beige text-soft-grey">
                        {category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Info className="mr-2 h-4 w-4" />
                        <span>Details</span>
                      </DropdownMenuItem>
                    )}
                    {onRemove && (
                      <DropdownMenuItem onClick={onRemove}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Side selector */}
              {renderSideSelector()}

              {/* Cues */}
              {cues && cues.length > 0 && (
                <div className="mt-2">
                  <ul className="text-xs text-soft-grey space-y-1">
                    {cues.slice(0, 2).map((cue, index) => (
                      <li key={index} className="flex">
                        <span className="mr-1">•</span>
                        <span className="truncate">{cue}</span>
                      </li>
                    ))}
                    {cues.length > 2 && (
                      <li className="text-xs italic">
                        +{cues.length - 2} more cues...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PoseCard 