import { redirect } from 'next/navigation'
import { EnhancedToastProvider } from "@/components/ui-enhanced/toast-provider"

export default function BetaGeneratorRedirectPage() {
  redirect('/generate')
  // Adding the provider as a fallback in case any code runs before the redirect
  return (
    <EnhancedToastProvider>
      <div>Redirecting...</div>
    </EnhancedToastProvider>
  )
} 