import { Suspense } from "react"
import { AccountContent } from "./components/account-content"
import { PageContainer } from "@/components/page-container"
import { createServerSupabaseClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function AccountPage() {
  const supabase = createServerSupabaseClient()

  // Get the current user server-side
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to login if not authenticated
    redirect("/login?redirect=/account")
  }

  return (
    <div className="py-8">
      <PageContainer>
        <h1 className="text-4xl font-normal mb-6">Account Settings</h1>
        <Suspense fallback={<div className="text-center my-8">Loading account information...</div>}>
          <AccountContent initialUser={session.user} />
        </Suspense>
      </PageContainer>
    </div>
  )
} 