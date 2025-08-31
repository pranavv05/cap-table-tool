"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { enhancedMathEngine } from "@/lib/enhanced-math-engine"

export function MathEngineDemo() {
  const [pricedRoundResult, setPricedRoundResult] = useState<any>(null)
  const [safeResult, setSafeResult] = useState<any>(null)
  const [esopResult, setEsopResult] = useState<any>(null)
  const [exitResult, setExitResult] = useState<any>(null)

  const testPricedRound = () => {
    try {
      const result = enhancedMathEngine.calculatePricedRound({
        amount: 2000000, // $2M
        preMoney: 8000000, // $8M pre-money
        optionPoolAdjustment: 20, // 20% option pool
        isPreMoneyOptionPool: true,
      })
      setPricedRoundResult(result)
    } catch (error) {
      console.error("Priced round calculation error:", error)
    }
  }

  const testSafeConversion = () => {
    try {
      const safeTerms = {
        amount: 500000,
        valuationCap: 5000000,
        discountRate: 0.2,
        hasMFN: false,
        conversionTrigger: "qualified_financing" as const,
        qualifiedFinancingThreshold: 1000000,
      }

      const triggerRound = {
        id: "series-a",
        name: "Series A",
        type: "priced" as const,
        date: new Date(),
        amount: 3000000,
        preMoney: 12000000,
        leadInvestor: "VC Fund",
        investors: [],
      }

      const result = enhancedMathEngine.convertSAFE(safeTerms, triggerRound)
      setSafeResult(result)
    } catch (error) {
      console.error("SAFE conversion error:", error)
    }
  }

  const testEsopComparison = () => {
    try {
      const fundingRound = {
        id: "series-a",
        name: "Series A",
        type: "priced" as const,
        date: new Date(),
        amount: 2000000,
        preMoney: 8000000,
        leadInvestor: "VC Fund",
        investors: [],
      }

      const result = enhancedMathEngine.compareESOPScenarios(20, fundingRound)
      setEsopResult(result)
    } catch (error) {
      console.error("ESOP comparison error:", error)
    }
  }

  const testExitCalculation = () => {
    try {
      const exitScenario = {
        exitValue: 50000000, // $50M exit
        exitType: "acquisition" as const,
        date: new Date(),
        useSimpleCalculation: true,
      }

      const result = enhancedMathEngine.calculateSimpleExit(exitScenario)
      setExitResult(result)
    } catch (error) {
      console.error("Exit calculation error:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Enhanced Math Engine Demo</h2>
        <p className="text-muted-foreground mt-2">Test all fundraising scenarios with accurate calculations</p>
      </div>

      <Tabs defaultValue="priced" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="priced">Priced Rounds</TabsTrigger>
          <TabsTrigger value="safe">SAFE Conversion</TabsTrigger>
          <TabsTrigger value="esop">ESOP Analysis</TabsTrigger>
          <TabsTrigger value="exit">Exit Modeling</TabsTrigger>
        </TabsList>

        <TabsContent value="priced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Priced Round Calculator</CardTitle>
              <CardDescription>Test pre/post-money valuations, dilution, and option pool adjustments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testPricedRound} className="w-full">
                Calculate $2M Series A ($8M pre-money, 20% ESOP)
              </Button>

              {pricedRoundResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pre-Money Valuation</Label>
                    <div className="text-2xl font-bold">${(pricedRoundResult.preMoney / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Post-Money Valuation</Label>
                    <div className="text-2xl font-bold">${(pricedRoundResult.postMoney / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Share Price</Label>
                    <div className="text-2xl font-bold">${pricedRoundResult.sharePrice.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Shares Issued</Label>
                    <div className="text-2xl font-bold">{pricedRoundResult.newSharesIssued.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SAFE Conversion Calculator</CardTitle>
              <CardDescription>Test valuation caps, discount rates, and conversion scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testSafeConversion} className="w-full">
                Convert $500K SAFE ($5M cap, 20% discount)
              </Button>

              {safeResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Conversion Method</Label>
                    <Badge variant="secondary">{safeResult.conversionMethod.replace("_", " ").toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Conversion Price</Label>
                    <div className="text-2xl font-bold">${safeResult.conversionPrice.toFixed(2)}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Shares Issued</Label>
                    <div className="text-2xl font-bold">{safeResult.sharesIssued.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Post-Conversion Ownership</Label>
                    <div className="text-2xl font-bold">{safeResult.postConversionOwnership.toFixed(2)}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ESOP Pool Analysis</CardTitle>
              <CardDescription>Compare pre-money vs post-money option pool scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testEsopComparison} className="w-full">
                Compare 20% ESOP Pool Scenarios
              </Button>

              {esopResult && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant={esopResult.summary.recommendation === "pre_money" ? "default" : "secondary"}>
                      Recommendation: {esopResult.summary.recommendation.replace("_", "-").toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">{esopResult.summary.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Label>Metric</Label>
                    </div>
                    <div className="text-center">
                      <Label>Pre-Money</Label>
                    </div>
                    <div className="text-center">
                      <Label>Post-Money</Label>
                    </div>

                    {esopResult.detailedComparison.map((metric: any, index: number) => (
                      <div key={index} className="contents">
                        <div className="text-sm">{metric.metric}</div>
                        <div className="text-sm font-mono">
                          {metric.preMoney.toFixed(2)}
                          {metric.unit}
                        </div>
                        <div className="text-sm font-mono">
                          {metric.postMoney.toFixed(2)}
                          {metric.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Scenario Calculator</CardTitle>
              <CardDescription>Model exit distributions and return multiples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testExitCalculation} className="w-full">
                Calculate $50M Exit Scenario
              </Button>

              {exitResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Total Payout</Label>
                      <div className="text-2xl font-bold">${(exitResult.totalPayout / 1000000).toFixed(1)}M</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Price Per Share</Label>
                      <div className="text-2xl font-bold">${exitResult.summary.pricePerShare.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Avg Return Multiple</Label>
                      <div className="text-2xl font-bold">{exitResult.summary.averageReturnMultiple.toFixed(1)}x</div>
                    </div>
                  </div>

                  {exitResult.distributions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Distribution Preview</Label>
                      <div className="text-sm text-muted-foreground">
                        {exitResult.distributions.length} stakeholders would receive payouts
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
