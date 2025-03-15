import { Suspense } from "react"
import { LoginForm } from "./components/login-form"
import { PageContainer } from "@/components/page-container"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <PageContainer maxWidth="narrow" centered>
        <h1 className="text-4xl font-normal text-center mb-4">Sign In</h1>
        <p className="text-center text-muted-foreground mb-8">
          Sign in to your account to save and manage your yoga sequences.
        </p>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </PageContainer>
    </div>
  )
}

