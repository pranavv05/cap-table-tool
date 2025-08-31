"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Calendar, Target } from "lucide-react"

interface FundingRoundsOverviewProps {
  fundingRounds: any[]
}

export function FundingRoundsOverview({ fundingRounds }: FundingRoundsOverviewProps) {
  // Calculate metrics
  const totalRounds = fundingRounds.length
  const totalRaised = fundingRounds.reduce((sum, round) => sum + (round.total_investment || 0), 0)
  const completedRounds = fundingRounds.filter((round) => round.is_completed).length
  const latestValuation =
    fundingRounds
      .filter((round) => round.post_money_valuation && round.is_completed)
      .sort((a, b) => new Date(b.closing_date).getTime() - new Date(a.closing_date).getTime())[0]
      ?.post_money_valuation || 0

  const metrics = [
    {
      title: "Total Rounds",
      value: totalRounds.toString(),
      icon: Target,
      change: `${completedRounds} completed`,
      changeType: "neutral" as const,
    },
    {
      title: "Total Raised",
      value: `$${(totalRaised / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      change: "Across all rounds",
      changeType: "positive" as const,
    },
    {
      title: "Latest Valuation",
      value: latestValuation ? `$${(latestValuation / 1000000).toFixed(1)}M` : "N/A",
      icon: TrendingUp,
      change: "Post-money valuation",
      changeType: "neutral" as const,
    },
    {
      title: "Last Round",
      value: fundingRounds.length > 0 ? fundingRounds[0].round_name : "None",
      icon: Calendar,
      change: fundingRounds.length > 0 ? new Date(fundingRounds[0].closing_date).toLocaleDateString() : "No rounds yet",
      changeType: "neutral" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <p
                className={`text-xs mt-1 ${
                  metric.changeType === "positive"
                    ? "text-green-600"
                    : metric.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {metric.change}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
