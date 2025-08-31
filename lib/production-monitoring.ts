import { NextRequest, NextResponse } from 'next/server'

// Production monitoring and logging utilities

export class ProductionLogger {
  private static instance: ProductionLogger
  
  static getInstance() {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger()
    }
    return ProductionLogger.instance
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      environment: process.env.NODE_ENV,
      userId: data?.userId || 'anonymous'
    }

    // Console logging
    console[level](JSON.stringify(logEntry))

    // Send to external monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration would go here
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error, data?: any) {
    this.log('error', message, { ...data, error: error?.stack })
  }
}

// Rate limiting middleware
export class RateLimiter {
  private requests = new Map<string, number[]>()
  
  isAllowed(identifier: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= limit) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
}

// Performance monitoring
export class PerformanceMonitor {
  static trackApiCall(req: NextRequest, res: NextResponse, duration: number) {
    const logger = ProductionLogger.getInstance()
    
    logger.info('API Call', {
      method: req.method,
      url: req.url,
      duration,
      status: res.status,
      userAgent: req.headers.get('user-agent')
    })
    
    // Alert on slow requests
    if (duration > 5000) {
      logger.warn('Slow API Response', {
        method: req.method,
        url: req.url,
        duration
      })
    }
  }
  
  static trackError(error: Error, context?: any) {
    const logger = ProductionLogger.getInstance()
    
    logger.error('Application Error', error, context)
  }
}

// Health check utilities
export class HealthCheck {
  static async checkDatabase(): Promise<boolean> {
    try {
      // Add database connectivity check
      return true
    } catch (error) {
      ProductionLogger.getInstance().error('Database health check failed', error as Error)
      return false
    }
  }
  
  static async checkExternalServices(): Promise<boolean> {
    try {
      // Check Clerk, Supabase, etc.
      return true
    } catch (error) {
      ProductionLogger.getInstance().error('External services health check failed', error as Error)
      return false
    }
  }
}

export { ProductionLogger as default }