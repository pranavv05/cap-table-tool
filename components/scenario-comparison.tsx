"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { calculateScenarioOutcomes } from "@/lib/scenario-calculations"

interface ScenarioComparisonProps {
  scenarios: any[]
  shareholders: any[]
  equityGrants: any[]
}

export function ScenarioComparison({ scenarios, shareholders, equityGrants }: ScenarioComparisonProps) {
  const [selectedScenario1, setSelectedScenario1] = useState<string>("")
  const [selectedScenario2, setSelectedScenario2] = useState<string>("")

  const scenario1 = scenarios.find((s) => s.id === selectedScenario1)
  const scenario2 = scenarios.find((s) => s.id === selectedScenario2)

  const outcomes1 = scenario1 ? calculateScenarioOutcomes(scenario1, shareholders, equityGrants, []) : null
  const outcomes2 = scenario2 ? calculateScenarioOutcomes(scenario2, shareholders, equityGrants, []) : null

  if (scenarios.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Create at least 2 scenarios to enable comparison</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario Selectors */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Scenario 1</label>
            <Select value={selectedScenario1} onValueChange={setSelectedScenario1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Scenario 2</label>
            <Select value={selectedScenario2} onValueChange={setSelectedScenario2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios
                  .filter((s) => s.id !== selectedScenario1)
                  .map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Results */}
        {scenario1 && scenario2 && outcomes1 && outcomes2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Badge variant="outline">{scenario1.name}</Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline">{scenario2.name}</Badge>
              </div>
            </div>

            {/* Key Metrics Comparison */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-500">Total Value</div>
                  <div className="font-semibold">
                    ${((scenario1.exit_valuation || scenario1.new_pre_money_valuation || 0) / 1000000).toFixed(0)}M
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Total Value</div>
                  <div className="font-semibold">
                    ${((scenario2.exit_valuation || scenario2.new_pre_money_valuation || 0) / 1000000).toFixed(0)}M
                  </div>
                </div>
              </div>

              {scenario1.scenario_type === "exit" && scenario2.scenario_type === "exit" && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500">Common Proceeds</div>
                    <div className="font-semibold">${(outcomes1.commonProceeds / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Common Proceeds</div>
                    <div className="font-semibold">${(outcomes2.commonProceeds / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Shareholder Comparison */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Top Shareholders</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  {outcomes1.shareholderOutcomes.slice(0, 3).map((outcome: any) => (
                    <div key={outcome.shareholderId} className="flex justify-between">
                      <span className="truncate">{outcome.shareholderName}</span>
                      <span>${(outcome.payout / 1000000).toFixed(1)}M</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {outcomes2.shareholderOutcomes.slice(0, 3).map((outcome: any) => (
                    <div key={outcome.shareholderId} className="flex justify-between">
                      <span className="truncate">{outcome.shareholderName}</span>
                      <span>${(outcome.payout / 1000000).toFixed(1)}M</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
