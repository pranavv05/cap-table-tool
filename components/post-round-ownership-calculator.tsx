"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Calculator, TrendingDown, TrendingUp } from "lucide-react"
import { calculatePostRoundOwnership } from "@/lib/post-round-calculations"

interface PostRoundOwnershipProps {
  companyId: string
  fundingRounds: any[]
  shareholders: any[]
  equityGrants: any[]
}

export function PostRoundOwnershipCalculator({
  companyId,
  fundingRounds,
  shareholders,
  equityGrants,
}: PostRoundOwnershipProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [ownershipData, setOwnershipData] = useState<any>(null)
  const [selectedRound, setSelectedRound] = useState<string>("current")

  const calculateOwnership = async () => {
    setIsCalculating(true)
    try {
      const results = await calculatePostRoundOwnership({
        fundingRounds,
        shareholders,
        equityGrants,
        throughRound: selectedRound === "current" ? null : selectedRound,
      })
      setOwnershipData(results)
    } catch (error) {
      console.error("Error calculating ownership:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  useEffect(() => {
    calculateOwnership()
  }, [selectedRound, fundingRounds, shareholders, equityGrants])

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
          <Calculator className="h-5 w-5" />
          Post-Round Ownership Calculator
        </CardTitle>
        <CardDescription>
          Calculate ownership percentages for founders, ESOP, and investors after each round
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Round Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedRound === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRound("current")}
          >
            Current
          </Button>
          {fundingRounds.map((round) => (
            <Button
              key={round.id}
              variant={selectedRound === round.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRound(round.id)}
            >
              {round.round_name}
            </Button>
          ))}
        </div>

        {/* Calculation Results */}
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculating ownership percentages...</span>
          </div>
        ) : ownershipData ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{ownershipData.founderOwnership.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Founder Ownership</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{ownershipData.investorOwnership.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Investor Ownership</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{ownershipData.esopOwnership.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">ESOP Pool</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold">Detailed Ownership Breakdown</h4>
              {ownershipData.stakeholders.map((stakeholder: any) => (
                <div key={stakeholder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getStakeholderTypeColor(stakeholder.type)}>{stakeholder.type}</Badge>
                    <div>
                      <div className="font-medium">{stakeholder.name}</div>
                      <div className="text-sm text-muted-foreground">{stakeholder.shares.toLocaleString()} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{stakeholder.ownership.toFixed(2)}%</div>
                    {stakeholder.dilution !== 0 && (
                      <div
                        className={`text-sm flex items-center gap-1 ${
                          stakeholder.dilution > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {stakeholder.dilution > 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        {Math.abs(stakeholder.dilution).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ownership Visualization */}
            <div className="space-y-2">
              <h4 className="font-semibold">Ownership Distribution</h4>
              <div className="space-y-2">
                {ownershipData.stakeholders.map((stakeholder: any) => (
                  <div key={stakeholder.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{stakeholder.name}</span>
                      <span>{stakeholder.ownership.toFixed(1)}%</span>
                    </div>
                    <Progress value={stakeholder.ownership} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
