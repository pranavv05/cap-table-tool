import { NextRequest, NextResponse } from "next/server"
import { monitoring } from "@/lib/monitoring-system"
import { createClient } from "@/lib/supabase/server"

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: { status: 'pass' | 'fail', responseTime?: number, details?: string }
    auth: { status: 'pass' | 'fail', responseTime?: number, details?: string }
    memory: { status: 'pass' | 'fail', usage: number, limit: number }
    disk: { status: 'pass' | 'fail', usage?: number, details?: string }
    external: { status: 'pass' | 'fail', services: Record<string, boolean> }
  }
  metrics: {
    requestCount: number
    errorRate: number
    averageResponseTime: number
    activeConnections: number
  }
}

// Track basic metrics
let requestCount = 0
let errorCount = 0
let totalResponseTime = 0
const startTime = Date.now()

export async function GET(request: NextRequest): Promise<NextResponse> {
  const start = Date.now()
  requestCount++

  try {
    // Initialize health check result
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: { status: 'pass' },
        auth: { status: 'pass' },
        memory: { status: 'pass', usage: 0, limit: 0 },
        disk: { status: 'pass' },
        external: { status: 'pass', services: {} }
      },
      metrics: {
        requestCount,
        errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
        averageResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
        activeConnections: 0
      }
    }

    // Check database connectivity
    try {
      const dbStart = Date.now()
      const supabase = await createClient()
      
      // Simple query to test connectivity
      const { error } = await supabase
        .from('companies')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      const dbResponseTime = Date.now() - dbStart

      if (error) {
        healthCheck.checks.database = {
          status: 'fail',
          responseTime: dbResponseTime,
          details: `Database error: ${error.message}`
        }
      } else {
        healthCheck.checks.database = {
          status: 'pass',
          responseTime: dbResponseTime,
          details: 'Database connection successful'
        }
      }
    } catch (error) {
      healthCheck.checks.database = {
        status: 'fail',
        details: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // Check authentication service (Clerk)
    try {
      const authStart = Date.now()
      const clerkUrl = `https://api.clerk.dev/v1/users/count`
      
      const response = await fetch(clerkUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const authResponseTime = Date.now() - authStart

      if (response.ok) {
        healthCheck.checks.auth = {
          status: 'pass',
          responseTime: authResponseTime,
          details: 'Clerk API accessible'
        }
      } else {
        healthCheck.checks.auth = {
          status: 'fail',
          responseTime: authResponseTime,
          details: `Clerk API responded with status ${response.status}`
        }
      }
    } catch (error) {
      healthCheck.checks.auth = {
        status: 'fail',
        details: `Clerk API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024
    const memoryLimitMB = memoryUsage.heapTotal / 1024 / 1024
    const memoryUsagePercent = (memoryUsageMB / memoryLimitMB) * 100

    healthCheck.checks.memory = {
      status: memoryUsagePercent > 90 ? 'fail' : memoryUsagePercent > 75 ? 'fail' : 'pass',
      usage: Math.round(memoryUsageMB),
      limit: Math.round(memoryLimitMB)
    }

    // Check external services
    const externalServices: Record<string, boolean> = {}
    
    // Check Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          signal: AbortSignal.timeout(3000)
        })
        externalServices.supabase = response.ok
      }
    } catch (error) {
      externalServices.supabase = false
    }

    healthCheck.checks.external = {
      status: Object.values(externalServices).every(Boolean) ? 'pass' : 'fail',
      services: externalServices
    }

    // Determine overall health status
    const failedChecks = Object.values(healthCheck.checks).filter(check => check.status === 'fail')
    
    if (failedChecks.length === 0) {
      healthCheck.status = 'healthy'
    } else if (failedChecks.length === 1 || (failedChecks.length === 2 && healthCheck.checks.external.status === 'fail')) {
      healthCheck.status = 'degraded'
    } else {
      healthCheck.status = 'unhealthy'
    }

    // Update metrics
    const responseTime = Date.now() - start
    totalResponseTime += responseTime

    // Log health check to monitoring system
    await monitoring.logEvent({
      type: healthCheck.status === 'healthy' ? 'info' : 'warning',
      source: 'health-check',
      message: `Health check completed: ${healthCheck.status}`,
      details: {
        status: healthCheck.status,
        failedChecks: failedChecks.length,
        responseTime,
        memoryUsage: memoryUsageMB,
        uptime: healthCheck.uptime
      },
      severity: healthCheck.status === 'healthy' ? 'low' : healthCheck.status === 'degraded' ? 'medium' : 'high',
      tags: ['health-check', healthCheck.status]
    })

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: httpStatus })

  } catch (error) {
    errorCount++
    
    // Log error
    await monitoring.trackError(
      error instanceof Error ? error : new Error('Health check failed'),
      { endpoint: '/api/health' }
    )

    const errorResponse: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: { status: 'fail', details: 'Health check failed' },
        auth: { status: 'fail', details: 'Health check failed' },
        memory: { status: 'fail', usage: 0, limit: 0 },
        disk: { status: 'fail', details: 'Health check failed' },
        external: { status: 'fail', services: {} }
      },
      metrics: {
        requestCount,
        errorRate: (errorCount / requestCount) * 100,
        averageResponseTime: totalResponseTime / requestCount,
        activeConnections: 0
      }
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Simple health check endpoint (for load balancers)
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick memory check
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    
    if (memoryUsagePercent > 95) {
      return new NextResponse(null, { status: 503 })
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}