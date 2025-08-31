#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Environment templates
const environments = {
  development: {
    NODE_ENV: 'development',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
    PORT: '3000',
    
    // Clerk (use test keys)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_your_publishable_key_here',
    CLERK_SECRET_KEY: 'sk_test_your_secret_key_here',
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: '/dashboard',
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: '/onboarding',
    
    // Supabase (use development project)
    NEXT_PUBLIC_SUPABASE_URL: 'https://your-dev-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_dev_anon_key',
    SUPABASE_SERVICE_ROLE_KEY: 'your_dev_service_role_key',
    
    // Security (generate secure secrets)
    NEXTAUTH_SECRET: '',
    ENCRYPTION_KEY: '',
    
    // Rate Limiting
    RATE_LIMIT_MAX: '1000',
    RATE_LIMIT_WINDOW: '900000',
    
    // Feature Flags
    ENABLE_ANALYTICS: 'false',
    ENABLE_ERROR_REPORTING: 'false',
    ENABLE_PERFORMANCE_MONITORING: 'false',
    ENABLE_AI_FEATURES: 'true',
    
    // Compliance
    COMPLIANCE_MODE: 'NONE',
  },
  
  staging: {
    NODE_ENV: 'staging',
    NEXT_PUBLIC_APP_URL: 'https://staging.yourdomain.com',
    NEXT_PUBLIC_API_URL: 'https://staging.yourdomain.com/api',
    PORT: '3000',
    
    // Clerk (use staging keys)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_your_staging_publishable_key',
    CLERK_SECRET_KEY: 'sk_live_your_staging_secret_key',
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: '/dashboard',
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: '/onboarding',
    
    // Supabase (use staging project)
    NEXT_PUBLIC_SUPABASE_URL: 'https://your-staging-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_staging_anon_key',
    SUPABASE_SERVICE_ROLE_KEY: 'your_staging_service_role_key',
    
    // Security
    NEXTAUTH_SECRET: '',
    ENCRYPTION_KEY: '',
    
    // Rate Limiting
    RATE_LIMIT_MAX: '500',
    RATE_LIMIT_WINDOW: '900000',
    
    // Monitoring
    NEXT_PUBLIC_SENTRY_DSN: 'https://your-sentry-dsn@sentry.io/project',
    VERCEL_ANALYTICS_ID: 'your_vercel_analytics_id',
    
    // Feature Flags
    ENABLE_ANALYTICS: 'true',
    ENABLE_ERROR_REPORTING: 'true',
    ENABLE_PERFORMANCE_MONITORING: 'true',
    ENABLE_AI_FEATURES: 'false',
    
    // Compliance
    COMPLIANCE_MODE: 'SOX',
  },
  
  production: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://yourdomain.com',
    NEXT_PUBLIC_API_URL: 'https://yourdomain.com/api',
    PORT: '3000',
    
    // Clerk (use production keys)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_your_production_publishable_key',
    CLERK_SECRET_KEY: 'sk_live_your_production_secret_key',
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: '/dashboard',
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: '/onboarding',
    
    // Supabase (use production project)
    NEXT_PUBLIC_SUPABASE_URL: 'https://your-production-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_production_anon_key',
    SUPABASE_SERVICE_ROLE_KEY: 'your_production_service_role_key',
    
    // Security
    NEXTAUTH_SECRET: '',
    ENCRYPTION_KEY: '',
    
    // Rate Limiting
    RATE_LIMIT_MAX: '100',
    RATE_LIMIT_WINDOW: '900000',
    
    // Monitoring
    NEXT_PUBLIC_SENTRY_DSN: 'https://your-production-sentry-dsn@sentry.io/project',
    VERCEL_ANALYTICS_ID: 'your_production_vercel_analytics_id',
    AUDIT_LOG_ENDPOINT: 'https://your-audit-service.com/logs',
    
    // External Services
    OPENAI_API_KEY: 'your_openai_api_key',
    STRIPE_SECRET_KEY: 'sk_live_your_stripe_secret_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_your_stripe_webhook_secret',
    
    // Email
    RESEND_API_KEY: 'your_resend_api_key',
    
    // Storage
    AWS_ACCESS_KEY_ID: 'your_aws_access_key',
    AWS_SECRET_ACCESS_KEY: 'your_aws_secret_key',
    AWS_REGION: 'us-east-1',
    AWS_S3_BUCKET: 'your-production-bucket',
    
    // Feature Flags
    ENABLE_ANALYTICS: 'true',
    ENABLE_ERROR_REPORTING: 'true',
    ENABLE_PERFORMANCE_MONITORING: 'true',
    ENABLE_AI_FEATURES: 'true',
    
    // Compliance
    COMPLIANCE_MODE: 'SOX',
  }
}

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex')
}

function createEnvFile(environment, outputPath) {
  console.log(`📝 Creating ${environment} environment file...`)
  
  const config = { ...environments[environment] }
  
  // Generate secure secrets if empty
  if (!config.NEXTAUTH_SECRET) {
    config.NEXTAUTH_SECRET = generateSecureSecret(32)
  }
  if (!config.ENCRYPTION_KEY) {
    config.ENCRYPTION_KEY = generateSecureSecret(32)
  }
  
  // Create env file content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n')
  
  // Add header comment
  const header = `# ${environment.toUpperCase()} ENVIRONMENT CONFIGURATION
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

`
  
  const fullContent = header + envContent
  
  // Write file
  fs.writeFileSync(outputPath, fullContent)
  
  console.log(`✅ Environment file created: ${outputPath}`)
  
  // Security warnings
  if (environment === 'production') {
    console.log('\n🚨 PRODUCTION SECURITY CHECKLIST:')
    console.log('1. Replace all placeholder values with real credentials')
    console.log('2. Ensure this file is not committed to version control')
    console.log('3. Use a secure secret management system in production')
    console.log('4. Rotate secrets regularly')
    console.log('5. Audit access to environment variables')
  }
  
  return fullContent
}

function validateExistingEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: ['File does not exist'] }
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const errors = []
  
  // Check for placeholder values
  const placeholders = [
    'your_publishable_key_here',
    'your_secret_key_here',
    'your-project.supabase.co',
    'your_anon_key',
    'yourdomain.com'
  ]
  
  placeholders.forEach(placeholder => {
    if (content.includes(placeholder)) {
      errors.push(`Contains placeholder: ${placeholder}`)
    }
  })
  
  // Check for required variables
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY'
  ]
  
  required.forEach(variable => {
    if (!content.includes(variable)) {
      errors.push(`Missing required variable: ${variable}`)
    }
  })
  
  return { valid: errors.length === 0, errors }
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const environment = args[1]
  
  console.log('🚀 Cap Table Tool - Environment Setup')
  console.log('=====================================\n')
  
  switch (command) {
    case 'create':
      if (!environment || !environments[environment]) {
        console.error('❌ Invalid environment. Use: development, staging, or production')
        process.exit(1)
      }
      
      const outputPath = `.env.${environment}`
      
      if (fs.existsSync(outputPath)) {
        console.log(`⚠️  File ${outputPath} already exists`)
        console.log('Use "update" command to modify or delete the file manually')
        process.exit(1)
      }
      
      createEnvFile(environment, outputPath)
      break
      
    case 'validate':
      const envFile = environment ? `.env.${environment}` : '.env.local'
      console.log(`🔍 Validating ${envFile}...`)
      
      const validation = validateExistingEnv(envFile)
      
      if (validation.valid) {
        console.log('✅ Environment file is valid')
      } else {
        console.log('❌ Environment file has issues:')
        validation.errors.forEach(error => console.log(`  - ${error}`))
        process.exit(1)
      }
      break
      
    case 'update':
      if (!environment || !environments[environment]) {
        console.error('❌ Invalid environment. Use: development, staging, or production')
        process.exit(1)
      }
      
      const updatePath = `.env.${environment}`
      createEnvFile(environment, updatePath)
      break
      
    case 'copy':
      const source = args[1]
      const target = args[2]
      
      if (!source || !target) {
        console.error('❌ Usage: copy <source-env> <target-env>')
        process.exit(1)
      }
      
      const sourcePath = `.env.${source}`
      const targetPath = `.env.${target}`
      
      if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source file ${sourcePath} does not exist`)
        process.exit(1)
      }
      
      fs.copyFileSync(sourcePath, targetPath)
      console.log(`✅ Copied ${sourcePath} to ${targetPath}`)
      break
      
    default:
      console.log('Usage:')
      console.log('  node setup-environment.js create <development|staging|production>')
      console.log('  node setup-environment.js validate [environment]')
      console.log('  node setup-environment.js update <development|staging|production>')
      console.log('  node setup-environment.js copy <source-env> <target-env>')
      console.log('')
      console.log('Examples:')
      console.log('  node setup-environment.js create development')
      console.log('  node setup-environment.js validate production')
      console.log('  node setup-environment.js copy development staging')
      break
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  createEnvFile,
  validateExistingEnv,
  generateSecureSecret,
  environments
}