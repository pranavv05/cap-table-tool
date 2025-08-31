"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Calculator, BarChart3 } from "lucide-react"

interface ScenariosOverviewProps {
  scenarios: any[]
}

export function ScenariosOverview({ scenarios }: ScenariosOverviewProps) {
  // Calculate metrics
  const totalScenarios = scenarios.length
  const exitScenarios = scenarios.filter((s) => s.scenario_type === "exit").length
  const fundingScenarios = scenarios.filter((s) => s.scenario_type === "funding_round").length
  const baselineScenario = scenarios.find((s) => s.is_baseline)

  // Calculate average exit valuation
  const exitValuations = scenarios
    .filter((s) => s.scenario_type === "exit" && s.exit_valuation)
    .map((s) => s.exit_valuation)
  const avgExitValuation =
    exitValuations.length > 0 ? exitValuations.reduce((a, b) => a + b, 0) / exitValuations.length : 0

  const metrics = [
    {
      title: "Total Scenarios",
      value: totalScenarios.toString(),
      icon: Target,
      change: `${exitScenarios} exit, ${fundingScenarios} funding`,
      changeType: "neutral" as const,
    },
    {
      title: "Avg Exit Valuation",
      value: avgExitValuation > 0 ? `$${(avgExitValuation / 1000000).toFixed(0)}M` : "N/A",
      icon: TrendingUp,
      change: `Based on ${exitValuations.length} scenarios`,
      changeType: "neutral" as const,
    },
    {
      title: "Baseline Scenario",
      value: baselineScenario ? baselineScenario.name : "None set",
      icon: Calculator,
      change: "Reference point for comparisons",
      changeType: "neutral" as const,
    },
    {
      title: "Analysis Ready",
      value: scenarios.length >= 2 ? "Yes" : "No",
      icon: BarChart3,
      change: "Need 2+ scenarios to compare",
      changeType: scenarios.length >= 2 ? ("positive" as const) : ("neutral" as const),
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
