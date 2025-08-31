"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Calculator, TrendingUp, Users, DollarSign, Info, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface FundingTimelineEnhancedProps {
  fundingRounds: any[]
  shareholders?: any[]
}

export function FundingTimelineEnhanced({ fundingRounds, shareholders = [] }: FundingTimelineEnhancedProps) {
  const [selectedRound, setSelectedRound] = useState<any>(null)
  const [showAuditDrawer, setShowAuditDrawer] = useState(false)

  const ownershipDriftData = fundingRounds.map((round, index) => {
    const foundersOwnership = 100 - (index + 1) * 15 // Simplified calculation
    const investorsOwnership = (index + 1) * 12
    const esopOwnership = (index + 1) * 3

    return {
      round: round.round_name,
      founders: foundersOwnership,
      investors: investorsOwnership,
      esop: esopOwnership,
      valuation: round.post_money_valuation / 1000000,
    }
  })

  const exitWaterfallData = [
    { stakeholder: "Series A Investors", amount: 15000000, percentage: 30 },
    { stakeholder: "Seed Investors", amount: 8000000, percentage: 16 },
    { stakeholder: "Founders", amount: 22000000, percentage: 44 },
    { stakeholder: "ESOP Pool", amount: 5000000, percentage: 10 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Timeline Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funding Timeline
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track your company's funding journey and see how ownership changes over time</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {fundingRounds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No funding rounds yet. Your timeline will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {fundingRounds.map((round, index) => (
                    <div
                      key={round.id}
                      className="relative flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>

                      {/* Round info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{round.round_name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {round.round_type.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Investment:</span>
                            <div className="font-mono font-medium">
                              ${(round.total_investment / 1000000).toFixed(1)}M
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Valuation:</span>
                            <div className="font-mono font-medium">
                              ${round.post_money_valuation ? (round.post_money_valuation / 1000000).toFixed(1) : "TBD"}M
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Share Price:</span>
                            <div className="font-mono font-medium">
                              ${round.price_per_share ? round.price_per_share.toFixed(2) : "TBD"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Dilution:</span>
                            <div className="font-mono font-medium text-orange-600">
                              -{((round.total_investment / round.post_money_valuation) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRound(round)}>
                              <Calculator className="h-4 w-4 mr-1" />
                              Math
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[600px] sm:w-[800px]">
                            <SheetHeader>
                              <SheetTitle>Round Mathematics - {round.round_name}</SheetTitle>
                            </SheetHeader>
                            <AuditDrawerContent round={round} />
                          </SheetContent>
                        </Sheet>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ownership Evolution
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>See how ownership percentages change across funding rounds</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ownershipDriftData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis label={{ value: "Ownership %", angle: -90, position: "insideLeft" }} />
                  <Line type="monotone" dataKey="founders" stroke="#8884d8" strokeWidth={2} name="Founders" />
                  <Line type="monotone" dataKey="investors" stroke="#82ca9d" strokeWidth={2} name="Investors" />
                  <Line type="monotone" dataKey="esop" stroke="#ffc658" strokeWidth={2} name="ESOP" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Exit Waterfall Simulation
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Projected distribution of exit proceeds at $50M exit value</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={exitWaterfallData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {exitWaterfallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {exitWaterfallData.map((item, index) => (
                  <div key={item.stakeholder} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.stakeholder}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">${(item.amount / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

function AuditDrawerContent({ round }: { round: any }) {
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Pre-Money Valuation</h4>
          <div className="font-mono text-lg">
            ${((round.post_money_valuation - round.total_investment) / 1000000).toFixed(1)}M
          </div>
          <p className="text-sm text-blue-700 mt-1">Company value before investment</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Post-Money Valuation</h4>
          <div className="font-mono text-lg">${(round.post_money_valuation / 1000000).toFixed(1)}M</div>
          <p className="text-sm text-green-700 mt-1">Company value after investment</p>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Calculation Breakdown</h4>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span>Investment Amount:</span>
            <span>${(round.total_investment / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between">
            <span>Pre-Money Valuation:</span>
            <span>${((round.post_money_valuation - round.total_investment) / 1000000).toFixed(1)}M</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Post-Money Valuation:</span>
            <span>${(round.post_money_valuation / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>Investor Ownership:</span>
            <span>{((round.total_investment / round.post_money_valuation) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Share Price Calculation</h4>
        <div className="space-y-2 font-mono text-sm">
          <div>Price per Share = Post-Money Valuation ÷ Total Shares Outstanding</div>
          <div>
            Price per Share = ${(round.post_money_valuation / 1000000).toFixed(1)}M ÷{" "}
            {(round.post_money_valuation / round.price_per_share / 1000000).toFixed(1)}M shares
          </div>
          <div className="font-semibold text-blue-600">
            Price per Share = ${round.price_per_share?.toFixed(2) || "TBD"}
          </div>
        </div>
      </div>

      {round.round_type === "safe" && (
        <div className="border rounded-lg p-4 bg-yellow-50">
          <h4 className="font-semibold mb-3">SAFE Conversion Logic</h4>
          <div className="space-y-2 text-sm">
            <div>Valuation Cap: ${(round.valuation_cap / 1000000).toFixed(1)}M</div>
            <div>Discount Rate: {round.discount_rate}%</div>
            <div className="font-medium text-yellow-800">Converts at lower of: Cap price vs Discounted price</div>
          </div>
        </div>
      )}
    </div>
  )
}
