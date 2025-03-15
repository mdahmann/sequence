/**
 * Design Tokens from Vite App
 * Contains merged design elements from both Vite and Next.js apps
 */

// Custom colors from the Vite app
export const colors = {
  // Core colors from Vite app
  'warm-white': '#F5F2ED',
  'soft-grey': '#8A8580',
  'muted-beige': '#D3CDC4',
  'vibrant-blue': '#2B44FF',
  'earthy-orange': '#E2673C',
}

// Spacing system (in px values)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px', 
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}

// Animation durations
export const durations = {
  fast: '0.2s',
  medium: '0.3s',
  slow: '0.5s',
  'very-slow': '1.2s',
}

// Animation easings
export const easings = {
  default: 'ease-out',
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
}

// Border radiuses
export const radii = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '9999px',
}

// Shadows
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
}

// Animation definitions migrated from Vite app
export const animations = {
  fadeIn: 'fade-in 0.3s ease-out',
  fadeOut: 'fade-out 0.3s ease-out',
  scaleIn: 'scale-in 0.2s ease-out',
  scaleOut: 'scale-out 0.2s ease-out',
  slideInRight: 'slide-in-right 0.3s ease-out',
  slideOutRight: 'slide-out-right 0.3s ease-out',
  enter: 'fade-in 0.5s ease-out, scale-in 0.4s ease-out',
  exit: 'fade-out 0.3s ease-out, scale-out 0.2s ease-out',
  spinSlow: 'spin-slow 20s linear infinite',
  spiralExpand: 'spiral-expand 1.2s ease-out',
}

// Helper type for responsive design
export type Responsive<T> = T | { base: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T }

// Component style presets
export const componentStyles = {
  // Card styles from Vite app
  card: {
    default: 'rounded-lg border border-muted bg-warm-white/80 backdrop-blur-sm p-6',
    interactive: 'rounded-lg border border-muted bg-warm-white/80 backdrop-blur-sm p-6 hover:shadow-md transition-all duration-300',
    elevated: 'rounded-lg border border-muted/20 bg-white shadow-md p-6',
  },
  
  // Button styles
  button: {
    primary: 'px-6 py-2 bg-vibrant-blue hover:bg-vibrant-blue/90 text-white font-medium rounded-full',
    secondary: 'px-6 py-2 bg-muted-beige hover:bg-muted-beige/90 text-soft-grey font-medium rounded-full',
    outline: 'px-6 py-2 border border-vibrant-blue text-vibrant-blue hover:bg-vibrant-blue/10 font-medium rounded-full',
  },
  
  // Form control styles
  formControl: {
    label: 'text-sm font-medium mb-1.5 block',
    input: 'w-full px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-all duration-200',
    select: 'w-full px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-all duration-200',
    radio: 'border-soft-grey text-vibrant-blue focus:ring-vibrant-blue/30',
  }
} 