"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface AIInsightsPanelProps {
  company: any
  shareholders: any[]
  equityGrants: any[]
  fundingRounds: any[]
  scenarios: any[]
}

interface AIInsight {
  type: "optimization" | "warning" | "opportunity" | "recommendation"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  actionable: boolean
}

export function AIInsightsPanel({
  company,
  shareholders,
  equityGrants,
  fundingRounds,
  scenarios,
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const generateInsights = async () => {
    setIsLoading(true)

    // Simulate AI analysis - in production, this would call an AI service
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedInsights: AIInsight[] = []

    // Analyze cap table structure
    const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const founderShares = equityGrants
      .filter((grant) => shareholders.find((s) => s.id === grant.shareholder_id)?.shareholder_type === "founder")
      .reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    const founderOwnership = totalShares > 0 ? (founderShares / totalShares) * 100 : 0

    if (founderOwnership < 60 && fundingRounds.length === 0) {
      generatedInsights.push({
        type: "warning",
        title: "Low Founder Ownership",
        description: `Founders own ${founderOwnership.toFixed(1)}% which is below recommended 60-80% for early-stage companies. Consider adjusting equity allocation before fundraising.`,
        impact: "high",
        actionable: true,
      })
    }

    // Analyze option pool
    const optionPoolGrants = equityGrants.filter((grant) => grant.grant_type === "stock_option")
    const optionPoolSize = optionPoolGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const optionPoolPercentage = totalShares > 0 ? (optionPoolSize / totalShares) * 100 : 0

    if (optionPoolPercentage < 10) {
      generatedInsights.push({
        type: "recommendation",
        title: "Expand Option Pool",
        description: `Current option pool is ${optionPoolPercentage.toFixed(1)}%. Consider expanding to 15-20% to attract key talent and maintain competitive compensation packages.`,
        impact: "medium",
        actionable: true,
      })
    }

    // Analyze vesting schedules
    const unvestedGrants = equityGrants.filter((grant) => grant.vesting_schedule && !grant.is_fully_vested)
    if (unvestedGrants.length > 0) {
      generatedInsights.push({
        type: "optimization",
        title: "Vesting Schedule Optimization",
        description: `${unvestedGrants.length} grants have active vesting schedules. Consider implementing acceleration clauses for key employees to reduce retention risk.`,
        impact: "medium",
        actionable: true,
      })
    }

    // Analyze funding readiness
    if (fundingRounds.length === 0 && scenarios.length > 0) {
      const exitScenarios = scenarios.filter((s) => s.scenario_type === "exit")
      if (exitScenarios.length > 0) {
        generatedInsights.push({
          type: "opportunity",
          title: "Funding Round Opportunity",
          description: `You've modeled ${exitScenarios.length} exit scenarios. Consider creating funding round scenarios to optimize valuation and dilution before approaching investors.`,
          impact: "high",
          actionable: true,
        })
      }
    }

    // Analyze scenario diversity
    if (scenarios.length < 3) {
      generatedInsights.push({
        type: "recommendation",
        title: "Expand Scenario Analysis",
        description:
          "Create more scenarios (conservative, optimistic, pessimistic) to better understand potential outcomes and make informed strategic decisions.",
        impact: "medium",
        actionable: true,
      })
    }

    // Compliance insights
    const recentGrants = equityGrants.filter((grant) => {
      const grantDate = new Date(grant.grant_date)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return grantDate > sixMonthsAgo
    })

    if (recentGrants.length > 0) {
      generatedInsights.push({
        type: "optimization",
        title: "83(b) Election Reminder",
        description: `${recentGrants.length} recent equity grants may benefit from 83(b) elections. Consult with legal counsel to optimize tax treatment.`,
        impact: "medium",
        actionable: true,
      })
    }

    setInsights(generatedInsights)
    setIsLoading(false)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <TrendingUp className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />
      case "recommendation":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "optimization":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-red-100 text-red-800"
      case "opportunity":
        return "bg-green-100 text-green-800"
      case "recommendation":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Insights</span>
          </CardTitle>
          <Button size="sm" onClick={generateInsights} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Generate Insights"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Click "Generate Insights" to get AI-powered recommendations for your cap table</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className={getInsightColor(insight.type)}>
                      {insight.type}
                    </Badge>
                    <Badge variant="secondary" className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
                {insight.actionable && (
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
