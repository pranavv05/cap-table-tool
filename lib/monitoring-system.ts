import { NextRequest, NextResponse } from 'next/server'

// Monitoring and alerting system for production
export interface MonitoringEvent {
  id: string
  timestamp: string
  type: 'error' | 'warning' | 'info' | 'performance' | 'security' | 'business'
  source: string
  message: string
  details?: any
  userId?: string
  companyId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags?: string[]
}

export interface PerformanceMetrics {
  responseTime: number
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  errorRate: number
  throughput: number
}

export interface AlertRule {
  id: string
  name: string
  condition: (event: MonitoringEvent | PerformanceMetrics) => boolean
  channels: ('email' | 'slack' | 'webhook')[]
  cooldown: number // minutes
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Monitoring service
export class MonitoringService {
  private static instance: MonitoringService
  private events: MonitoringEvent[] = []
  private metrics: PerformanceMetrics[] = []
  private alertRules: AlertRule[] = []
  private lastAlerts: Map<string, number> = new Map()

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  constructor() {
    this.initializeDefaultAlertRules()
    this.startMetricsCollection()
  }

  // Log monitoring events
  async logEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): Promise<void> {
    const monitoringEvent: MonitoringEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
    }

    this.events.push(monitoringEvent)
    
    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000)
    }

    // Send to external logging services
    await this.sendToExternalServices(monitoringEvent)

    // Check alert rules
    await this.checkAlertRules(monitoringEvent)

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${monitoringEvent.type.toUpperCase()}] ${monitoringEvent.message}`, monitoringEvent.details)
    }
  }

  // Record performance metrics
  recordMetrics(metrics: PerformanceMetrics): void {
    const timestamp = new Date().toISOString()
    this.metrics.push({ ...metrics })
    
    // Keep only last 1000 metric points
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Check performance-based alerts
    this.checkPerformanceAlerts(metrics)
  }

  // API monitoring middleware
  async monitorApiRequest(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = this.generateEventId()

    try {
      // Log request start
      await this.logEvent({
        type: 'info',
        source: 'api',
        message: `API Request: ${req.method} ${req.url}`,
        details: {
          requestId,
          method: req.method,
          url: req.url,
          userAgent: req.headers.get('user-agent'),
          ip: req.ip || req.headers.get('x-forwarded-for'),
        },
        severity: 'low',
        tags: ['api', 'request']
      })

      // Execute handler
      const response = await handler()
      const duration = Date.now() - startTime

      // Log successful response
      await this.logEvent({
        type: 'info',
        source: 'api',
        message: `API Response: ${response.status} in ${duration}ms`,
        details: {
          requestId,
          status: response.status,
          duration,
          size: response.headers.get('content-length'),
        },
        severity: duration > 5000 ? 'high' : duration > 2000 ? 'medium' : 'low',
        tags: ['api', 'response', 'performance']
      })

      // Record performance metrics
      this.recordMetrics({
        responseTime: duration,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0, // Would need to implement CPU monitoring
        activeConnections: 0, // Would need to track connections
        errorRate: 0,
        throughput: 1
      })

      return response

    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      await this.logEvent({
        type: 'error',
        source: 'api',
        message: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          requestId,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
          duration,
        },
        severity: 'high',
        tags: ['api', 'error']
      })

      throw error
    }
  }

  // Business metrics logging
  async logBusinessEvent(event: {
    action: string
    userId?: string
    companyId?: string
    details?: any
  }): Promise<void> {
    await this.logEvent({
      type: 'business',
      source: 'business',
      message: `Business Event: ${event.action}`,
      details: event.details,
      userId: event.userId,
      companyId: event.companyId,
      severity: 'low',
      tags: ['business', event.action]
    })
  }

  // Security event logging
  async logSecurityEvent(event: {
    type: string
    description: string
    userId?: string
    ip?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    details?: any
  }): Promise<void> {
    await this.logEvent({
      type: 'security',
      source: 'security',
      message: `Security Event: ${event.type} - ${event.description}`,
      details: {
        ...event.details,
        ip: event.ip,
      },
      userId: event.userId,
      severity: event.severity,
      tags: ['security', event.type]
    })
  }

  // Error tracking
  async trackError(error: Error, context?: any): Promise<void> {
    await this.logEvent({
      type: 'error',
      source: 'application',
      message: `Application Error: ${error.message}`,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
      },
      severity: 'high',
      tags: ['error', 'application']
    })

    // Send to external error tracking services
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration would go here
      try {
        // await Sentry.captureException(error, { extra: context })
      } catch (sentryError) {
        console.error('Failed to send error to Sentry:', sentryError)
      }
    }
  }

  // Health check monitoring
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail', details?: string }>
  }> {
    const checks: Record<string, { status: 'pass' | 'fail', details?: string }> = {}

    // Database connectivity
    try {
      // Would integrate with your database client
      checks.database = { status: 'pass', details: 'Connected' }
    } catch (error) {
      checks.database = { status: 'fail', details: error instanceof Error ? error.message : 'Unknown error' }
    }

    // External services
    try {
      // Check Clerk
      checks.auth = { status: 'pass', details: 'Clerk service accessible' }
    } catch (error) {
      checks.auth = { status: 'fail', details: 'Clerk service unavailable' }
    }

    // Memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    checks.memory = {
      status: memoryUsagePercent > 90 ? 'fail' : 'pass',
      details: `${memoryUsagePercent.toFixed(1)}% used`
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail')
    let status: 'healthy' | 'degraded' | 'unhealthy'
    
    if (failedChecks.length === 0) {
      status = 'healthy'
    } else if (failedChecks.length <= 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    // Log health check results
    await this.logEvent({
      type: status === 'healthy' ? 'info' : 'warning',
      source: 'health',
      message: `Health Check: ${status}`,
      details: { checks, failedChecks: failedChecks.length },
      severity: status === 'healthy' ? 'low' : status === 'degraded' ? 'medium' : 'high',
      tags: ['health', status]
    })

    return { status, checks }
  }

  // Initialize default alert rules
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (event) => event.type === 'error' && event.severity === 'high',
        channels: ['email', 'slack'],
        cooldown: 15,
        severity: 'high'
      },
      {
        id: 'security-incident',
        name: 'Security Incident',
        condition: (event) => event.type === 'security' && ['high', 'critical'].includes(event.severity),
        channels: ['email', 'slack', 'webhook'],
        cooldown: 5,
        severity: 'critical'
      },
      {
        id: 'slow-response',
        name: 'Slow API Response',
        condition: (metric) => 'responseTime' in metric && metric.responseTime > 10000,
        channels: ['slack'],
        cooldown: 30,
        severity: 'medium'
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: (metric) => 'memoryUsage' in metric && metric.memoryUsage > 1024 * 1024 * 1024, // 1GB
        channels: ['email'],
        cooldown: 60,
        severity: 'medium'
      }
    ]
  }

  // Check alert rules
  private async checkAlertRules(event: MonitoringEvent): Promise<void> {
    for (const rule of this.alertRules) {
      if (rule.condition(event)) {
        await this.triggerAlert(rule, event)
      }
    }
  }

  // Check performance alerts
  private async checkPerformanceAlerts(metrics: PerformanceMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (rule.condition(metrics)) {
        await this.triggerAlert(rule, metrics)
      }
    }
  }

  // Trigger alert
  private async triggerAlert(rule: AlertRule, data: MonitoringEvent | PerformanceMetrics): Promise<void> {
    const now = Date.now()
    const lastAlert = this.lastAlerts.get(rule.id) || 0
    const cooldownMs = rule.cooldown * 60 * 1000

    // Check cooldown
    if (now - lastAlert < cooldownMs) {
      return
    }

    this.lastAlerts.set(rule.id, now)

    // Send alerts
    for (const channel of rule.channels) {
      try {
        await this.sendAlert(channel, rule, data)
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error)
      }
    }

    // Log alert
    await this.logEvent({
      type: 'warning',
      source: 'alerting',
      message: `Alert triggered: ${rule.name}`,
      details: { rule, data },
      severity: rule.severity,
      tags: ['alert', rule.id]
    })
  }

  // Send alert to specific channel
  private async sendAlert(
    channel: 'email' | 'slack' | 'webhook',
    rule: AlertRule,
    data: MonitoringEvent | PerformanceMetrics
  ): Promise<void> {
    const alertMessage = this.formatAlertMessage(rule, data)

    switch (channel) {
      case 'email':
        await this.sendEmailAlert(alertMessage)
        break
      case 'slack':
        await this.sendSlackAlert(alertMessage)
        break
      case 'webhook':
        await this.sendWebhookAlert(alertMessage, data)
        break
    }
  }

  // Format alert message
  private formatAlertMessage(rule: AlertRule, data: any): string {
    return `🚨 Alert: ${rule.name}\n\nSeverity: ${rule.severity}\nTimestamp: ${new Date().toISOString()}\n\nDetails: ${JSON.stringify(data, null, 2)}`
  }

  // Send email alert
  private async sendEmailAlert(message: string): Promise<void> {
    // Implement email sending logic
    console.log('📧 Email alert:', message)
  }

  // Send Slack alert
  private async sendSlackAlert(message: string): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) return

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  // Send webhook alert
  private async sendWebhookAlert(message: string, data: any): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL
    if (!webhookUrl) return

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, data, timestamp: new Date().toISOString() })
      })
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  // Send to external services
  private async sendToExternalServices(event: MonitoringEvent): Promise<void> {
    // Send to external logging services
    if (process.env.DATADOG_API_KEY) {
      try {
        // DataDog integration
        await this.sendToDatadog(event)
      } catch (error) {
        console.error('Failed to send to DataDog:', error)
      }
    }

    if (process.env.LOGFLARE_API_KEY) {
      try {
        // Logflare integration
        await this.sendToLogflare(event)
      } catch (error) {
        console.error('Failed to send to Logflare:', error)
      }
    }
  }

  // DataDog integration
  private async sendToDatadog(event: MonitoringEvent): Promise<void> {
    const datadogUrl = 'https://http-intake.logs.datadoghq.com/v1/input'
    
    await fetch(`${datadogUrl}/${process.env.DATADOG_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ddsource: 'cap-table-tool',
        ddtags: event.tags?.join(','),
        service: 'cap-table-tool',
        message: event.message,
        level: event.type,
        ...event
      })
    })
  }

  // Logflare integration
  private async sendToLogflare(event: MonitoringEvent): Promise<void> {
    const logflareUrl = `https://api.logflare.app/logs?source=${process.env.LOGFLARE_SOURCE_ID}`
    
    await fetch(logflareUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.LOGFLARE_API_KEY!
      },
      body: JSON.stringify({
        log_entry: event.message,
        metadata: event
      })
    })
  }

  // Start metrics collection
  private startMetricsCollection(): void {
    if (typeof window !== 'undefined') return // Only run on server

    setInterval(() => {
      const memUsage = process.memoryUsage()
      
      this.recordMetrics({
        responseTime: 0, // Would be calculated from active requests
        memoryUsage: memUsage.heapUsed,
        cpuUsage: 0, // Would need CPU monitoring
        activeConnections: 0, // Would track active connections
        errorRate: 0, // Would calculate from recent errors
        throughput: 0 // Would calculate from recent requests
      })
    }, 60000) // Every minute
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Get metrics for dashboard
  getMetrics(): {
    events: MonitoringEvent[]
    metrics: PerformanceMetrics[]
    recentErrors: MonitoringEvent[]
    systemHealth: string
  } {
    const recentErrors = this.events
      .filter(e => e.type === 'error' && new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .slice(-50)

    const systemHealth = recentErrors.length > 10 ? 'unhealthy' : recentErrors.length > 5 ? 'degraded' : 'healthy'

    return {
      events: this.events.slice(-100),
      metrics: this.metrics.slice(-100),
      recentErrors,
      systemHealth
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()

// Helper functions for easy use
export const logError = (error: Error, context?: any) => monitoring.trackError(error, context)
export const logBusinessEvent = (action: string, details?: any) => monitoring.logBusinessEvent({ action, details })
export const logSecurityEvent = (type: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical') => 
  monitoring.logSecurityEvent({ type, description, severity })

export default monitoring