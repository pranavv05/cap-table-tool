import { z } from 'zod'

// Environment configuration schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  PORT: z.string().default('3000'),
  
  // Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().default('/onboarding'),
  
  // Database (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // Security
  NEXTAUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_WINDOW: z.string().default('900000'), // 15 minutes
  
  // Monitoring & Analytics
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  VERCEL_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  
  // External Services
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Email Services
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  
  // Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().default('true'),
  ENABLE_ERROR_REPORTING: z.string().default('true'),
  ENABLE_PERFORMANCE_MONITORING: z.string().default('true'),
  ENABLE_AI_FEATURES: z.string().default('false'),
  
  // Audit & Compliance
  AUDIT_LOG_ENDPOINT: z.string().url().optional(),
  COMPLIANCE_MODE: z.enum(['SOX', 'GDPR', 'SOC2', 'NONE']).default('NONE'),
  
  // Development
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    return { success: true, data: env, error: null }
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      error: error instanceof z.ZodError ? error.format() : error 
    }
  }
}

// Environment-specific configurations
const environmentConfigs = {
  development: {
    database: {
      connectionPoolSize: 5,
      queryTimeout: 30000,
      enableQueryLogging: true,
    },
    security: {
      rateLimitEnabled: false,
      corsOrigins: ['http://localhost:3000'],
      enableSecurityHeaders: false,
    },
    monitoring: {
      enableMetrics: true,
      enableTracing: false,
      logLevel: 'debug',
    },
  },
  staging: {
    database: {
      connectionPoolSize: 10,
      queryTimeout: 20000,
      enableQueryLogging: true,
    },
    security: {
      rateLimitEnabled: true,
      corsOrigins: ['https://staging.yourdomain.com'],
      enableSecurityHeaders: true,
    },
    monitoring: {
      enableMetrics: true,
      enableTracing: true,
      logLevel: 'info',
    },
  },
  production: {
    database: {
      connectionPoolSize: 20,
      queryTimeout: 10000,
      enableQueryLogging: false,
    },
    security: {
      rateLimitEnabled: true,
      corsOrigins: ['https://yourdomain.com'],
      enableSecurityHeaders: true,
    },
    monitoring: {
      enableMetrics: true,
      enableTracing: true,
      logLevel: 'warn',
    },
  },
}

// Get configuration for current environment
export function getConfig() {
  const validation = validateEnv()
  
  if (!validation.success) {
    console.error('❌ Environment validation failed:', validation.error)
    throw new Error('Invalid environment configuration')
  }
  
  const env = validation.data
  const envConfig = environmentConfigs[env.NODE_ENV]
  
  return {
    env,
    ...envConfig,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
  }
}

// Environment validation middleware
export function validateEnvironment() {
  const validation = validateEnv()
  
  if (!validation.success) {
    console.error('🚨 Environment Configuration Errors:')
    console.error(JSON.stringify(validation.error, null, 2))
    process.exit(1)
  }
  
  console.log('✅ Environment configuration validated successfully')
  return validation.data
}

// Security checks for production
export function validateProductionSecurity() {
  const config = getConfig()
  
  if (!config.isProduction) return
  
  const issues: string[] = []
  
  // Check for development keys in production
  if (config.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('test')) {
    issues.push('Using test Clerk keys in production')
  }
  
  if (config.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost')) {
    issues.push('Using localhost Supabase URL in production')
  }
  
  if (!config.env.NEXTAUTH_SECRET || config.env.NEXTAUTH_SECRET.length < 32) {
    issues.push('NEXTAUTH_SECRET is missing or too short')
  }
  
  if (!config.env.ENCRYPTION_KEY || config.env.ENCRYPTION_KEY.length < 32) {
    issues.push('ENCRYPTION_KEY is missing or too short')
  }
  
  if (issues.length > 0) {
    console.error('🚨 Production Security Issues:')
    issues.forEach(issue => console.error(`- ${issue}`))
    throw new Error('Production security validation failed')
  }
  
  console.log('✅ Production security validation passed')
}

// Dynamic configuration loader
export class ConfigLoader {
  private static config: ReturnType<typeof getConfig> | null = null
  
  static load() {
    if (!this.config) {
      this.config = getConfig()
    }
    return this.config
  }
  
  static reload() {
    this.config = null
    return this.load()
  }
  
  static get() {
    return this.load()
  }
}

export default {
  validateEnv,
  getConfig,
  validateEnvironment,
  validateProductionSecurity,
  ConfigLoader,
}