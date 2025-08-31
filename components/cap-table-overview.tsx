"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, DollarSign, PieChart } from "lucide-react"

interface CapTableOverviewProps {
  company: any
  shareholders: any[]
  equityGrants: any[]
}

export function CapTableOverview({ company, shareholders, equityGrants }: CapTableOverviewProps) {
  // Calculate metrics
  const totalShareholders = shareholders.length
  const totalSharesIssued = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
  const fullyDilutedShares = totalSharesIssued
  const availableShares = company.authorized_shares - totalSharesIssued

  // Calculate valuation (placeholder - would come from latest funding round)
  const estimatedValuation = 5000000 // $5M placeholder

  const metrics = [
    {
      title: "Total Shareholders",
      value: totalShareholders.toString(),
      icon: Users,
      change: "+2 this month",
      changeType: "positive" as const,
    },
    {
      title: "Shares Issued",
      value: totalSharesIssued.toLocaleString(),
      icon: PieChart,
      change: `${((totalSharesIssued / company.authorized_shares) * 100).toFixed(1)}% of authorized`,
      changeType: "neutral" as const,
    },
    {
      title: "Available Shares",
      value: availableShares.toLocaleString(),
      icon: TrendingUp,
      change: `${((availableShares / company.authorized_shares) * 100).toFixed(1)}% remaining`,
      changeType: "neutral" as const,
    },
    {
      title: "Est. Valuation",
      value: `$${(estimatedValuation / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      change: "Last updated 30 days ago",
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
