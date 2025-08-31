import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMITS = {
  api: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  upload: { requests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  export: { requests: 20, windowMs: 60 * 1000 }, // 20 exports per minute
}

// Security headers
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Custom headers
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Download-Options': 'noopen',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

function getClientIdentifier(request: NextRequest): string {
  // Use multiple identifiers for better accuracy
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') ||
             '127.0.0.1'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `${ip}-${userAgent.substring(0, 50)}`
}

function isRateLimited(identifier: string, limit: { requests: number; windowMs: number }): boolean {
  const now = Date.now()
  const userData = rateLimitStore.get(identifier)
  
  if (!userData || now > userData.resetTime) {
    // Reset or initialize
    rateLimitStore.set(identifier, { count: 1, resetTime: now + limit.windowMs })
    return false
  }
  
  if (userData.count >= limit.requests) {
    return true
  }
  
  userData.count++
  return false
}

function getRateLimitForPath(pathname: string): { requests: number; windowMs: number } {
  if (pathname.startsWith('/api/auth') || pathname.includes('sign-in') || pathname.includes('sign-up')) {
    return RATE_LIMITS.auth
  }
  if (pathname.includes('/upload') || pathname.includes('/import')) {
    return RATE_LIMITS.upload
  }
  if (pathname.includes('/export') || pathname.includes('/download')) {
    return RATE_LIMITS.export
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.api
  }
  return RATE_LIMITS.api // Default
}

function logSecurityEvent(type: string, details: any, request: NextRequest) {
  const securityEvent = {
    type,
    timestamp: new Date().toISOString(),
    ip: request.ip || request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    url: request.url,
    method: request.method,
    details
  }
  
  // Log to console in development, send to monitoring service in production
  console.warn('🚨 Security Event:', JSON.stringify(securityEvent, null, 2))
  
  // In production, send to your monitoring service
  // await sendToMonitoringService(securityEvent)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && !pathname.includes('/api/')
  ) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next()
  
  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = getRateLimitForPath(pathname)
  
  if (isRateLimited(clientId, rateLimit)) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      clientId,
      pathname,
      limit: rateLimit
    }, request)
    
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(rateLimit.windowMs / 1000).toString(),
        ...Object.fromEntries(Object.entries(SECURITY_HEADERS))
      }
    })
  }
  
  // Basic security checks
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    'sqlmap', 'nmap', 'nikto', 'curl', 'wget', 'python-requests',
    'bot', 'crawler', 'spider', 'scraper'
  ]
  
  if (suspiciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    logSecurityEvent('SUSPICIOUS_USER_AGENT', {
      userAgent,
      pathname
    }, request)
    
    // Block suspicious requests to sensitive endpoints
    if (pathname.startsWith('/api/') || pathname.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  // Check for common attack patterns in URL
  const maliciousPatterns = [
    '../', '..\\', '<script', 'javascript:', 'vbscript:',
    'onload=', 'onerror=', 'eval(', 'alert(', 'document.cookie'
  ]
  
  const fullUrl = request.url
  if (maliciousPatterns.some(pattern => fullUrl.toLowerCase().includes(pattern))) {
    logSecurityEvent('MALICIOUS_URL_PATTERN', {
      url: fullUrl,
      pattern: maliciousPatterns.find(p => fullUrl.toLowerCase().includes(p))
    }, request)
    
    return new NextResponse('Bad Request', { status: 400 })
  }
  
  // Authentication check for protected routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/shared/')) {
    // Check for authentication token
    const authHeader = request.headers.get('authorization')
    const sessionCookie = request.cookies.get('__session')
    
    if (!authHeader && !sessionCookie) {
      logSecurityEvent('UNAUTHORIZED_API_ACCESS', {
        pathname,
        hasAuthHeader: !!authHeader,
        hasSessionCookie: !!sessionCookie
      }, request)
      
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }
  
  // Add custom security headers based on route
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }
  
  // Supabase middleware for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/scenarios') || pathname.startsWith('/funding-rounds')) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              cookiesToSet.forEach(({ name, value, options }) => 
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up')) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }
    } catch (error) {
      logSecurityEvent('SUPABASE_AUTH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pathname
      }, request)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}