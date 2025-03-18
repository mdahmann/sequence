import { Suspense } from "react"
import { PageContainer } from "@/components/page-container"
import { ForgotPasswordForm } from "./components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <PageContainer maxWidth="narrow" centered>
        <h1 className="text-4xl font-normal text-center mb-4">Reset Password</h1>
        <p className="text-center text-muted-foreground mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </PageContainer>
    </div>
  )
} 