import { LoginForm } from "./components/login-form"

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-normal text-center mb-4">Sign In</h1>
        <p className="text-center text-muted-foreground mb-8">
          Sign in to your account to save and manage your yoga sequences.
        </p>

        <LoginForm />
      </div>
    </div>
  )
}

