"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, TrendingUp } from "lucide-react"
import { calculateExitOutcomes } from "@/lib/exit-calculations"

interface ExitSimulatorProps {
  companyId: string
  fundingRounds: any[]
  shareholders: any[]
  equityGrants: any[]
}

export function ExitSimulator({ companyId, fundingRounds, shareholders, equityGrants }: ExitSimulatorProps) {
  const [exitValue, setExitValue] = useState<string>("10000000")
  const [isCalculating, setIsCalculating] = useState(false)
  const [exitOutcomes, setExitOutcomes] = useState<any>(null)
  const [presetValues] = useState([
    { label: "2x Current", multiplier: 2 },
    { label: "5x Current", multiplier: 5 },
    { label: "10x Current", multiplier: 10 },
    { label: "20x Current", multiplier: 20 },
  ])

  const currentValuation =
    fundingRounds.length > 0 ? fundingRounds[fundingRounds.length - 1].post_money_valuation || 5000000 : 5000000

  const calculateExitScenario = async () => {
    setIsCalculating(true)
    try {
      const results = await calculateExitOutcomes({
        exitValue: Number.parseFloat(exitValue),
        fundingRounds,
        shareholders,
        equityGrants,
      })
      setExitOutcomes(results)
    } catch (error) {
      console.error("Error calculating exit outcomes:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  useEffect(() => {
    if (exitValue && Number.parseFloat(exitValue) > 0) {
      calculateExitScenario()
    }
  }, [exitValue, fundingRounds, shareholders, equityGrants])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStakeholderTypeColor = (type: string) => {
    switch (type) {
      case "founder":
        return "bg-blue-100 text-blue-800"
      case "investor":
        return "bg-green-100 text-green-800"
      case "employee":
        return "bg-purple-100 text-purple-800"
      case "esop":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Exit Simulator
        </CardTitle>
        <CardDescription>Input exit value and see cash outcomes per stakeholder</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exit Value Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exitValue">Exit Valuation ($)</Label>
            <Input
              id="exitValue"
              type="number"
              value={exitValue}
              onChange={(e) => setExitValue(e.target.value)}
              placeholder="Enter exit valuation"
            />
          </div>

          {/* Preset Values */}
          <div className="flex flex-wrap gap-2">
            {presetValues.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => setExitValue((currentValuation * preset.multiplier).toString())}
              >
                {preset.label} ({formatCurrency(currentValuation * preset.multiplier)})
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculating exit outcomes...</span>
          </div>
        ) : exitOutcomes ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(exitOutcomes.totalDistribution)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Distribution</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {exitOutcomes.averageReturnMultiple.toFixed(1)}x
                  </div>
                  <p className="text-sm text-muted-foreground">Average Return Multiple</p>
                </CardContent>
              </Card>
            </div>

            {/* Stakeholder Outcomes */}
            <div className="space-y-3">
              <h4 className="font-semibold">Cash Outcomes per Stakeholder</h4>
              {exitOutcomes.stakeholderOutcomes.map((outcome: any) => (
                <div key={outcome.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStakeholderTypeColor(outcome.type)}>{outcome.type}</Badge>
                    <div>
                      <div className="font-medium">{outcome.name}</div>
                      <div className="text-sm text-muted-foreground">{outcome.ownership.toFixed(2)}% ownership</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(outcome.payout)}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {outcome.returnMultiple.toFixed(1)}x return
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Liquidation Waterfall */}
            <div className="space-y-3">
              <h4 className="font-semibold">Liquidation Waterfall</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Total Exit Value:</span>
                  <span className="font-semibold">{formatCurrency(Number.parseFloat(exitValue))}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Preferred Liquidation Preferences:</span>
                  <span>{formatCurrency(exitOutcomes.preferredPayouts)}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Remaining for Common:</span>
                  <span>{formatCurrency(exitOutcomes.commonPayouts)}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded font-semibold">
                  <span>Total Distributed:</span>
                  <span>{formatCurrency(exitOutcomes.totalDistribution)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
