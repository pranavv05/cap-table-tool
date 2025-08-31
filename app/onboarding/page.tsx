"use client"

import { useAuth } from "@clerk/nextjs"
import { AuthGuard } from "@/components/auth-guard"
import { OnboardingForm } from "@/components/onboarding-form"

export default function OnboardingPage() {
  const { userId } = useAuth()
  const isDevelopment = process.env.NODE_ENV === 'development'
  const effectiveUserId = isDevelopment && !userId ? 'dev-user-123' : userId

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CapTable Pro</h1>
              <p className="text-gray-600">
                Let's set up your company profile to get started with managing your cap table
              </p>
            </div>

            {effectiveUserId && <OnboardingForm userId={effectiveUserId} />}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
