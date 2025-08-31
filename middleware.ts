import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/funding-rounds(.*)',
  '/scenarios(.*)',
  '/prd(.*)',
  '/api/companies(.*)',
  '/api/funding-rounds(.*)',
  '/api/scenarios(.*)',
  '/api/share-links(.*)',
  '/api/generate-prd(.*)'
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/demo(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/shared/(.*)',
  '/api/shared/(.*)',
  '/api/health(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return
  }

  // In development, be more lenient with auth errors
  const isDevelopment = process.env.NODE_ENV === 'development'

  // TEMPORARY: In development, bypass middleware completely for dashboard
  if (isDevelopment && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('[Development] Bypassing auth for dashboard')
    return
  }

  // TEMPORARY: In development, bypass middleware completely for onboarding
  if (isDevelopment && req.nextUrl.pathname.startsWith('/onboarding')) {
    console.log('[Development] Bypassing auth for onboarding')
    return
  }

  // Protect API routes and dashboard routes
  if (isProtectedRoute(req)) {
    try {
      await auth.protect()
    } catch (error) {
      if (isDevelopment) {
        console.warn('[Development] Auth protection failed, bypassing:', error)
        return // Allow through in development
      }
      throw error
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
