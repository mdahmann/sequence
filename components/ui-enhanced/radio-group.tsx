"use client"

import React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface RadioOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  options: RadioOption[]
  variant?: "default" | "cards" | "pills"
  showIcons?: boolean
  layout?: "horizontal" | "vertical" | "grid"
  gridCols?: 2 | 3 | 4
  animated?: boolean
  className?: string
}

export const EnhancedRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      className,
      options,
      variant = "default",
      showIcons = true,
      layout = "horizontal",
      gridCols = 2,
      animated = true,
      ...props
    },
    ref
  ) => {
    // Define layout classes
    const layoutClasses = {
      horizontal: "flex items-center space-x-4 flex-wrap gap-y-2",
      vertical: "flex flex-col space-y-3",
      grid: `grid grid-cols-1 sm:grid-cols-${gridCols} gap-3`,
    }

    // Define variants
    const itemVariants = {
      default: {
        container: "flex items-center space-x-2",
        radio:
          "h-4 w-4 border-soft-grey text-vibrant-blue focus:ring-vibrant-blue/30",
        content: "",
      },
      cards: {
        container:
          "relative border border-muted rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-vibrant-blue/50 data-[state=checked]:border-vibrant-blue data-[state=checked]:bg-vibrant-blue/5 flex items-start space-x-3",
        radio:
          "h-4 w-4 mt-1 border-soft-grey text-vibrant-blue focus:ring-vibrant-blue/30",
        content: "flex-1",
      },
      pills: {
        container:
          "relative px-4 py-2 border border-muted bg-white rounded-full cursor-pointer transition-all duration-200 hover:border-vibrant-blue/30 data-[state=checked]:border-vibrant-blue data-[state=checked]:bg-vibrant-blue/5 flex items-center justify-center",
        radio: "sr-only",
        content: "flex items-center space-x-2",
      },
    }

    // Animation variants
    const animations = {
      container: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
      },
      radio: {
        initial: { scale: 0.8 },
        checked: { scale: 1 },
      },
    }

    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn(layoutClasses[layout], className)}
        {...props}
      >
        {options.map((option, index) => {
          const MotionItem = animated
            ? motion(RadioGroupPrimitive.Item)
            : RadioGroupPrimitive.Item

          const motionProps = animated
            ? {
                initial: animations.container.initial,
                animate: animations.container.animate,
                transition: { delay: index * 0.05, duration: 0.2 },
              }
            : {}

          return (
            <MotionItem
              key={option.value}
              value={option.value}
              id={`${props.name || "radio"}-${option.value}`}
              className={cn(itemVariants[variant].container)}
              {...motionProps}
            >
              {variant !== "pills" && (
                <RadioGroupPrimitive.Indicator
                  className={cn(
                    "flex items-center justify-center relative",
                    animated && "overflow-hidden"
                  )}
                >
                  <motion.div
                    initial={animated ? animations.radio.initial : undefined}
                    animate={animated ? animations.radio.checked : undefined}
                    transition={{ duration: 0.15 }}
                  >
                    <Circle className="h-2.5 w-2.5 fill-current text-vibrant-blue" />
                  </motion.div>
                </RadioGroupPrimitive.Indicator>
              )}

              <div className={cn(itemVariants[variant].content)}>
                <div className="flex items-center">
                  {showIcons && option.icon && (
                    <span className="mr-2 text-vibrant-blue">{option.icon}</span>
                  )}

                  <label
                    htmlFor={`${props.name || "radio"}-${option.value}`}
                    className={cn(
                      "text-sm font-medium leading-none cursor-pointer",
                      {
                        "text-soft-grey data-[state=checked]:text-vibrant-blue":
                          variant === "pills",
                      }
                    )}
                  >
                    {option.label}
                  </label>
                </div>

                {option.description && variant === "cards" && (
                  <p className="mt-1 text-xs text-soft-grey">
                    {option.description}
                  </p>
                )}
              </div>
            </MotionItem>
          )
        })}
      </RadioGroupPrimitive.Root>
    )
  }
)

EnhancedRadioGroup.displayName = "EnhancedRadioGroup" 