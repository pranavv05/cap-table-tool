"use client"

import type React from "react"

import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  // TEMPORARY: In development, bypass auth completely
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (isDevelopment) {
    console.log('[Development] Bypassing AuthGuard - authentication disabled')
    return <>{children}</>
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const currentPath = window.location.pathname
      const redirectUrl = encodeURIComponent(window.location.href)
      router.push(`/sign-in?redirect_url=${redirectUrl}`)
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
