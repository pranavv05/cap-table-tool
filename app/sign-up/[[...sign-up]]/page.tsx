"use client"

import { SignUp, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignUpPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push("/onboarding")
    }
  }, [isSignedIn, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Get Started</h1>
          <p className="text-muted-foreground mt-2">Create your CapTable account</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card border border-border shadow-lg",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border border-border hover:bg-muted",
              formFieldInput: "bg-input border border-border",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}
