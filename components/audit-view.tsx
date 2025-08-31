"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, FileText, Calculator, Info } from "lucide-react"

interface AuditViewProps {
  fundingRounds: any[]
  shareholders: any[]
  equityGrants: any[]
}

export function AuditView({ fundingRounds, shareholders, equityGrants }: AuditViewProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())

  const toggleRound = (roundId: string) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId)
    } else {
      newExpanded.add(roundId)
    }
    setExpandedRounds(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateRoundMath = (round: any, previousRounds: any[]) => {
    const preMoneyValuation = round.pre_money_valuation || 0
    const investmentAmount = round.total_investment || 0
    const postMoneyValuation = preMoneyValuation + investmentAmount

    // Calculate shares issued
    const existingShares = previousRounds.reduce((sum, prevRound) => {
      return sum + (prevRound.shares_issued || 0)
    }, 10000000) // Assume 10M initial shares

    const pricePerShare = preMoneyValuation / existingShares
    const newSharesIssued = investmentAmount / pricePerShare
    const totalSharesAfter = existingShares + newSharesIssued

    // Calculate dilution
    const dilutionPercentage = (newSharesIssued / totalSharesAfter) * 100

    return {
      preMoneyValuation,
      investmentAmount,
      postMoneyValuation,
      existingShares,
      pricePerShare,
      newSharesIssued,
      totalSharesAfter,
      dilutionPercentage,
      investorOwnership: (newSharesIssued / totalSharesAfter) * 100,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit View
        </CardTitle>
        <CardDescription>Detailed math and assumptions for each funding round</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fundingRounds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No funding rounds to audit yet.</p>
            <p className="text-sm">Add funding rounds to see detailed calculations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fundingRounds.map((round, index) => {
              const previousRounds = fundingRounds.slice(0, index)
              const roundMath = calculateRoundMath(round, previousRounds)
              const isExpanded = expandedRounds.has(round.id)

              return (
                <Card key={round.id} className="border-l-4 border-l-blue-500">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <div>
                              <CardTitle className="text-lg">{round.round_name}</CardTitle>
                              <CardDescription>
                                {round.round_type} • {formatCurrency(round.total_investment)}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline">Round {index + 1}</Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Key Metrics */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Calculator className="h-4 w-4" />
                              Key Calculations
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Pre-money Valuation:</span>
                                <span className="font-medium">{formatCurrency(roundMath.preMoneyValuation)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Investment Amount:</span>
                                <span className="font-medium">{formatCurrency(roundMath.investmentAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Post-money Valuation:</span>
                                <span className="font-medium">{formatCurrency(roundMath.postMoneyValuation)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Price per Share:</span>
                                <span className="font-medium">${roundMath.pricePerShare.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">New Shares Issued:</span>
                                <span className="font-medium">{roundMath.newSharesIssued.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Shares After:</span>
                                <span className="font-medium">{roundMath.totalSharesAfter.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Impact Analysis */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Impact Analysis
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Investor Ownership:</span>
                                <span className="font-medium text-green-600">
                                  {roundMath.investorOwnership.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Dilution to Existing:</span>
                                <span className="font-medium text-red-600">
                                  {roundMath.dilutionPercentage.toFixed(1)}%
                                </span>
                              </div>
                              {round.liquidation_preference && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Liquidation Preference:</span>
                                  <span className="font-medium">{round.liquidation_preference}x</span>
                                </div>
                              )}
                              {round.anti_dilution_provision && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Anti-dilution:</span>
                                  <span className="font-medium">{round.anti_dilution_provision}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Assumptions */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">Key Assumptions:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Share price calculated as pre-money valuation ÷ existing shares</li>
                            <li>• New shares issued = investment amount ÷ price per share</li>
                            <li>• Dilution = new shares ÷ total shares after round</li>
                            {round.round_type === "SAFE" && (
                              <>
                                <li>• SAFE converts at lower of cap or discount to next round</li>
                                <li>• Conversion assumes qualified financing trigger</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
