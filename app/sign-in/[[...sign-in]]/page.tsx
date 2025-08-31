"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function SignInPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isSignedIn) {
      // Get the redirect URL from query parameters
      const redirectUrl = searchParams.get('redirect_url')
      if (redirectUrl) {
        // Decode and navigate to the original URL
        try {
          const decodedUrl = decodeURIComponent(redirectUrl)
          const url = new URL(decodedUrl)
          router.push(url.pathname + url.search)
        } catch {
          // If URL parsing fails, default to dashboard
          router.push("/dashboard")
        }
      } else {
        router.push("/dashboard")
      }
    }
  }, [isSignedIn, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your CapTable account</p>
        </div>
        <SignIn
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
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl={searchParams.get('redirect_url') || undefined}
        />
      </div>
    </div>
  )
}
