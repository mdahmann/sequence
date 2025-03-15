"use client"

import { ReactNode } from "react"
import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"

interface BetaGeneratorLayoutProps {
  children: ReactNode
}

export default function BetaGeneratorLayout({ children }: BetaGeneratorLayoutProps) {
  return (
    <div className="min-h-screen bg-beige dark:bg-dark-gray">
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-vibrant-blue/10 text-vibrant-blue text-xs font-medium rounded-full">
            Beta
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Enhanced Sequence Generator
          </h1>
          <p className="text-muted-gray dark:text-muted-beige">
            Try our new sequence generator with improved features
          </p>
        </div>
        
        <EnhancedToastProvider>
          {children}
        </EnhancedToastProvider>
      </div>
    </div>
  )
} 