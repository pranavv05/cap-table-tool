"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, AlertTriangle, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import ProfessionalCapTableInterface from "@/components/professional-cap-table-interface"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loading, CardSkeleton } from "@/components/ui/loading"
import { PageErrorBoundary, useErrorHandler } from "@/components/ui/error-boundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DashboardData {
  company: any
  shareholders: any[]
  equityGrants: any[]
  fundingRounds: any[]
  scenarios: any[]
}

export default function DashboardPage() {
  const { userId } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const handleError = useErrorHandler()
  const router = useRouter()
  const { signOut } = useAuth()
  const { user } = useUser()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // TEMPORARY: In development, use a dummy user ID if auth is not working
  const isDevelopment = process.env.NODE_ENV === 'development'
  const effectiveUserId = isDevelopment && !userId ? 'dev-user-123' : userId

  const fetchData = async () => {
    if (!effectiveUserId) return

    try {
      setLoading(true)
      setError(null)
      
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        if (isDevelopment) {
          console.log('[Development] Supabase not configured, showing demo data')
          // Set demo data for development
          setData({
            company: {
              id: 'demo-company',
              name: 'Demo Company Inc.',
              description: 'This is a demo company for development',
              incorporation_date: new Date().toISOString(),
              jurisdiction: 'Delaware',
              company_type: 'C-Corp',
              authorized_shares: 10000000,
              par_value: 0.001
            },
            shareholders: [],
            equityGrants: [],
            fundingRounds: [],
            scenarios: []
          })
          return
        }
        throw new Error('Database configuration missing. Please configure Supabase environment variables.')
      }
      
      const supabase = createClient()

      // Fetch user's company with timeout
      const { data: companies, error: companiesError } = await Promise.race([
        supabase
          .from("companies")
          .select("*")
          .eq("clerk_user_id", effectiveUserId)
          .limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as any

      if (companiesError) {
        throw new Error(`Failed to fetch company: ${companiesError.message}`)
      }

      if (!companies || companies.length === 0) {
        if (isDevelopment) {
          console.log('[Development] No company found, redirecting to onboarding')
        }
        router.push("/onboarding")
        return
      }

      const company = companies[0]

      // Fetch all related data with individual error handling
      const [shareholdersResult, equityGrantsResult, fundingRoundsResult, scenariosResult] = await Promise.allSettled([
        supabase.from("shareholders").select(`*, equity_grants (*)`).eq("company_id", company.id),
        supabase
          .from("equity_grants")
          .select(`*, shareholders (name, shareholder_type)`)
          .eq("company_id", company.id)
          .eq("is_active", true),
        supabase
          .from("funding_rounds")
          .select("*")
          .eq("company_id", company.id)
          .order("closing_date", { ascending: false }),
        supabase.from("scenarios").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      ])

      // Handle partial failures gracefully
      const extractData = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled' && result.value.data) {
          return result.value.data
        }
        if (result.status === 'rejected') {
          handleError(new Error(`Data fetch failed: ${result.reason}`))
        }
        return []
      }

      setData({
        company,
        shareholders: extractData(shareholdersResult),
        equityGrants: extractData(equityGrantsResult),
        fundingRounds: extractData(fundingRoundsResult),
        scenarios: extractData(scenariosResult),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      handleError(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userId, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-h-screen">
          <header className="bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-bold">Cap Table Dashboard</h1>
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-sm text-muted-foreground">
                    {user.fullName || user.emailAddresses[0]?.emailAddress}
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto p-4">
            <div className="w-full max-w-md">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Failed to load dashboard</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>{error}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleRetry}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Try Again
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push("/onboarding")}>
                      Go to Onboarding
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <PageErrorBoundary>
      <AuthGuard>
        <div className="flex flex-col min-h-screen">
          <header className="bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-bold">Cap Table Dashboard</h1>
              <div className="flex items-center space-x-4">
                {user && (
                  <span className="text-sm text-muted-foreground">
                    {user.fullName || user.emailAddresses[0]?.emailAddress}
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto p-4">
            {loading ? (
              <div className="min-h-screen bg-background p-6">
                <div className="space-y-6">
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded w-64 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-96 animate-pulse" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-9 w-9 bg-muted rounded animate-pulse" />
                      <div className="h-9 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Metrics Cards Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                  
                  {/* Main Content Skeleton */}
                  <div className="space-y-4">
                    <div className="h-10 bg-muted rounded w-full animate-pulse" />
                    <div className="h-96 bg-muted rounded w-full animate-pulse" />
                  </div>
                </div>
                
                <Loading 
                  variant="financial" 
                  size="lg" 
                  message="Loading your cap table data..." 
                  className="fixed bottom-8 right-8" 
                />
              </div>
            ) : (
              <ProfessionalCapTableInterface
                company={data?.company}
                shareholders={data?.shareholders || []}
                equityGrants={data?.equityGrants || []}
                fundingRounds={data?.fundingRounds || []}
                scenarios={data?.scenarios || []}
              />
            )}
          </main>
        </div>
      </AuthGuard>
    </PageErrorBoundary>
  )
}
