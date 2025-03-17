import { redirect } from 'next/navigation'

export default function BetaGeneratorRedirectPage() {
  redirect('/generate')
  return null
} 