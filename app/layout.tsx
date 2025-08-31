import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

export const metadata: Metadata = {
  title: "CapTable - Equity Management Platform",
  description: "Simplify your equity management with our comprehensive cap table platform",
  generator: "v0.app",
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Error</h1>
              <p className="text-gray-600 mb-4">
                The application is missing required configuration. Please contact support.
              </p>
              <p className="text-sm text-gray-500">Error: {error.message}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isDevelopment = process.env.NODE_ENV === 'development'

  console.log("[v0] Clerk publishable key:", publishableKey ? "Found" : "Missing")

  // In development, allow the app to work without Clerk configuration
  if (!publishableKey) {
    if (isDevelopment) {
      console.warn("[v0] Development mode: Running without Clerk authentication")
      return (
        <html lang="en">
          <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
            <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-sm text-yellow-800">
              ⚠️ Development Mode: Authentication disabled
            </div>
            {children}
          </body>
        </html>
      )
    } else {
      console.error("[v0] Missing Clerk Publishable Key - rendering error fallback")
      return <ErrorFallback error={new Error("Missing Clerk Publishable Key")} />
    }
  }
  
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined
      }}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
