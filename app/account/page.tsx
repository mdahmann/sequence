import { Suspense } from "react"
import { AccountContent } from "./components/account-content"
import { PageContainer } from "@/components/page-container"

export default function AccountPage() {
  return (
    <div className="py-8">
      <PageContainer>
        <h1 className="text-4xl font-normal mb-6">Account Settings</h1>
        <Suspense fallback={<div className="text-center my-8">Loading account information...</div>}>
          <AccountContent />
        </Suspense>
      </PageContainer>
    </div>
  )
} 