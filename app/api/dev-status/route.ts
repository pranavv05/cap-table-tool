import { NextResponse } from 'next/server'

export async function GET() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasClerkConfig = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
  const hasSupabaseConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return NextResponse.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    developmentMode: isDevelopment,
    configuration: {
      clerk: hasClerkConfig ? 'configured' : 'missing',
      supabase: hasSupabaseConfig ? 'configured' : 'missing'
    },
    features: {
      authentication: hasClerkConfig ? 'enabled' : 'bypassed (development)',
      database: hasSupabaseConfig ? 'enabled' : 'demo data (development)'
    },
    message: isDevelopment 
      ? 'Development mode active - app works without full configuration'
      : 'Production mode - requires full configuration'
  })
}