import { Suspense } from "react"
import { SignupForm } from "./components/signup-form"
import { PageContainer } from "@/components/page-container"

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <PageContainer maxWidth="medium" centered>
        <h1 className="text-4xl font-normal text-center mb-4">Sign Up</h1>
        <p className="text-center text-muted-foreground mb-8">
          Create an account to save and manage your yoga sequences.
        </p>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </PageContainer>
    </div>
  )
} 