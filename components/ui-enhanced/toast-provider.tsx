"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

type ToastType = "success" | "error" | "info" | "warning" | "auth"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  position?: "bottom-right" | "center"
  actions?: {
    label: string
    onClick: () => void
  }[]
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (
    message: string, 
    type?: ToastType, 
    duration?: number, 
    position?: "bottom-right" | "center",
    actions?: {
      label: string
      onClick: () => void
    }[]
  ) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a EnhancedToastProvider")
  }
  return context
}

interface EnhancedToastProviderProps {
  children: ReactNode
}

export function EnhancedToastProvider({ children }: EnhancedToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (
    message: string, 
    type: ToastType = "info", 
    duration: number = 5000,
    position: "bottom-right" | "center" = "bottom-right",
    actions?: {
      label: string
      onClick: () => void
    }[]
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration, position, actions }])
    
    if (duration !== Infinity) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }
  }

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Filter toasts by position
  const bottomRightToasts = toasts.filter((toast) => toast.position !== "center")
  const centerToasts = toasts.filter((toast) => toast.position === "center")

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      
      {/* Bottom right toasts */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        <AnimatePresence>
          {bottomRightToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`p-4 rounded-lg shadow-lg max-w-sm flex items-start ${
                toast.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                toast.type === "error" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" :
                toast.type === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                toast.type === "auth" ? "bg-vibrant-blue text-white dark:bg-vibrant-blue dark:text-white" :
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              <div className="flex-grow">
                {toast.message}
              </div>
              <button
                onClick={() => hideToast(toast.id)}
                className="ml-3 flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Center screen toasts */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <AnimatePresence>
          {centerToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`p-6 rounded-lg shadow-xl max-w-md pointer-events-auto ${
                toast.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" :
                toast.type === "error" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" :
                toast.type === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" :
                toast.type === "auth" ? "bg-vibrant-blue text-white dark:bg-vibrant-blue dark:text-white" :
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-grow text-center text-lg font-medium">
                  {toast.message}
                </div>
                <button
                  onClick={() => hideToast(toast.id)}
                  className="ml-3 flex-shrink-0 text-white hover:text-gray-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Action buttons */}
              {toast.actions && toast.actions.length > 0 && (
                <div className="mt-4 flex justify-center space-x-3">
                  {toast.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        hideToast(toast.id);
                      }}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        index === 0 
                          ? "bg-white text-vibrant-blue hover:bg-gray-100" 
                          : "bg-transparent border border-white text-white hover:bg-white/10"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
} 