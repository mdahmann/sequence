import { Suspense } from "react"
import { PageContainer } from "@/components/page-container"
import { ResetPasswordForm } from "./components/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <PageContainer maxWidth="narrow" centered>
        <h1 className="text-4xl font-normal text-center mb-4">Create New Password</h1>
        <p className="text-center text-muted-foreground mb-8">
          Please enter your new password below.
        </p>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </PageContainer>
    </div>
  )
} 