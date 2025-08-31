"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, Clock, AlertTriangle, Share, Lock } from "lucide-react"
import { format } from "date-fns"

interface SharedScenarioData {
  scenario: {
    id: string
    scenario_name: string
    scenario_type: string
    description?: string
    exit_valuation?: number
    created_at: string
  }
  shareLink: {
    permissions: {
      canView: boolean
      canComment: boolean
      canEdit: boolean
      requiresAuth: boolean
    }
    expires_at: string
    access_count: number
  }
  company: {
    name: string
  }
}

export default function SharedScenarioPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<SharedScenarioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const shareToken = params.shareToken as string

  useEffect(() => {
    const fetchSharedScenario = async () => {
      try {
        const response = await fetch(`/api/shared/${shareToken}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("This shared link is invalid or has been removed.")
          } else if (response.status === 410) {
            setError("This shared link has expired.")
          } else if (response.status === 401) {
            setError("You need to sign in to view this shared scenario.")
          } else {
            setError("Failed to load the shared scenario.")
          }
          return
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error("Failed to fetch shared scenario:", err)
        setError("Failed to load the shared scenario.")
      } finally {
        setLoading(false)
      }
    }

    if (shareToken) {
      fetchSharedScenario()
    }
  }, [shareToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading shared scenario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => router.push("/")} 
              variant="outline" 
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { scenario, shareLink, company } = data
  const isExpired = new Date(shareLink.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Share className="h-6 w-6 text-primary" />
                {scenario.scenario_name}
              </h1>
              <p className="text-muted-foreground">
                Shared from {company.name} • {format(new Date(scenario.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                {shareLink.permissions.canEdit ? "Edit" : shareLink.permissions.canComment ? "Comment" : "View"} Access
              </Badge>
              {shareLink.permissions.requiresAuth && (
                <Badge variant="outline">
                  <Lock className="h-3 w-3 mr-1" />
                  Auth Required
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Expiration Warning */}
          {isExpired && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This shared link expired on {format(new Date(shareLink.expires_at), "PPP")}
              </AlertDescription>
            </Alert>
          )}

          {/* Scenario Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium">{scenario.scenario_type}</p>
                </div>
                {scenario.exit_valuation && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Exit Valuation</label>
                    <p className="font-medium">${scenario.exit_valuation.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {scenario.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{scenario.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Share Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">
                  {format(new Date(shareLink.expires_at), "PPP 'at' p")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Access Count</span>
                <span className="font-medium">{shareLink.access_count} views</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permissions</span>
                <div className="flex gap-1">
                  {shareLink.permissions.canView && <Badge variant="outline">View</Badge>}
                  {shareLink.permissions.canComment && <Badge variant="outline">Comment</Badge>}
                  {shareLink.permissions.canEdit && <Badge variant="outline">Edit</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for scenario content */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Scenario visualization and data would be displayed here.</p>
                <p className="text-sm mt-2">
                  This would include cap table data, ownership breakdowns, and projections
                  based on the user's permissions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Want to create your own cap table scenarios?</h3>
                <p className="text-muted-foreground">
                  Join thousands of founders using our platform to model funding rounds and track equity.
                </p>
                <Button onClick={() => router.push("/sign-up")}>
                  Get Started Free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}