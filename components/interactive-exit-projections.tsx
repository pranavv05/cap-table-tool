"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, DollarSign, Users, Percent } from "lucide-react"

interface Stakeholder {
  id: string
  name: string
  type: "founder" | "investor" | "employee" | "esop_pool"
  shares: number
  liquidationPreference?: number
  participationRights?: boolean
  preferredMultiple?: number
}

interface ExitScenario {
  exitValue: number
  stakeholderReturns: {
    stakeholderId: string
    shares: number
    percentage: number
    payout: number
    multiple: number
  }[]
}

const mockStakeholders: Stakeholder[] = [
  { id: "1", name: "John Doe (CEO)", type: "founder", shares: 6000000 },
  { id: "2", name: "Jane Smith (CTO)", type: "founder", shares: 4000000 },
  {
    id: "3",
    name: "Acme Ventures",
    type: "investor",
    shares: 2000000,
    liquidationPreference: 5000000,
    participationRights: true,
    preferredMultiple: 1,
  },
  {
    id: "4",
    name: "Beta Capital",
    type: "investor",
    shares: 1500000,
    liquidationPreference: 3000000,
    participationRights: false,
    preferredMultiple: 1,
  },
  { id: "5", name: "ESOP Pool", type: "esop_pool", shares: 1500000 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function InteractiveExitProjections() {
  const [exitValue, setExitValue] = useState(50000000)
  const [loading, setLoading] = useState(false)

  const totalShares = useMemo(() => {
    return mockStakeholders.reduce((sum, stakeholder) => sum + stakeholder.shares, 0)
  }, [])

  const calculateExitScenario = useMemo((): ExitScenario => {
    setLoading(true)

    // Simulate complex calculation loading
    setTimeout(() => setLoading(false), 500)

    let remainingValue = exitValue
    const stakeholderReturns = []

    // Step 1: Pay liquidation preferences first
    const investorsWithPrefs = mockStakeholders.filter((s) => s.liquidationPreference)
    for (const investor of investorsWithPrefs) {
      const prefPayout = Math.min(investor.liquidationPreference!, remainingValue)
      remainingValue -= prefPayout

      stakeholderReturns.push({
        stakeholderId: investor.id,
        shares: investor.shares,
        percentage: (investor.shares / totalShares) * 100,
        payout: prefPayout,
        multiple: prefPayout / (investor.liquidationPreference! / (investor.preferredMultiple || 1)),
      })
    }

    // Step 2: Distribute remaining value pro-rata
    if (remainingValue > 0) {
      for (const stakeholder of mockStakeholders) {
        const proRataShare = (stakeholder.shares / totalShares) * remainingValue
        const existingReturn = stakeholderReturns.find((r) => r.stakeholderId === stakeholder.id)

        if (existingReturn) {
          // For participating preferred, add pro-rata share
          if (stakeholder.participationRights) {
            existingReturn.payout += proRataShare
          } else {
            // Take the better of liquidation preference or pro-rata
            existingReturn.payout = Math.max(existingReturn.payout, proRataShare)
          }
        } else {
          // Common shareholders get pro-rata share
          stakeholderReturns.push({
            stakeholderId: stakeholder.id,
            shares: stakeholder.shares,
            percentage: (stakeholder.shares / totalShares) * 100,
            payout: proRataShare,
            multiple: stakeholder.type === "founder" ? proRataShare / 100000 : 0, // Assume $100k founder investment
          })
        }
      }
    }

    return { exitValue, stakeholderReturns }
  }, [exitValue, totalShares])

  const exitMultiples = [1, 2, 3, 5, 10, 20]
  const currentValuation = 20000000 // Mock current valuation

  const multipleScenarios = exitMultiples.map((multiple) => {
    const scenarioValue = currentValuation * multiple
    let remainingValue = scenarioValue
    const returns: { [key: string]: number } = {}

    // Calculate returns for each multiple
    mockStakeholders.forEach((stakeholder) => {
      if (stakeholder.liquidationPreference) {
        const prefPayout = Math.min(stakeholder.liquidationPreference, remainingValue)
        returns[stakeholder.name] = prefPayout
        remainingValue -= prefPayout
      }
    })

    // Distribute remaining pro-rata
    if (remainingValue > 0) {
      mockStakeholders.forEach((stakeholder) => {
        const proRataShare = (stakeholder.shares / totalShares) * remainingValue
        if (stakeholder.participationRights) {
          returns[stakeholder.name] = (returns[stakeholder.name] || 0) + proRataShare
        } else {
          returns[stakeholder.name] = Math.max(returns[stakeholder.name] || 0, proRataShare)
        }
      })
    }

    return {
      multiple: `${multiple}x`,
      exitValue: scenarioValue,
      ...returns,
    }
  })

  const pieData = calculateExitScenario.stakeholderReturns.map((stakeholder, index) => ({
    name: mockStakeholders.find((s) => s.id === stakeholder.stakeholderId)?.name || "Unknown",
    value: stakeholder.payout,
    percentage: (stakeholder.payout / exitValue) * 100,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Exit Value Projections
          </CardTitle>
          <CardDescription>Model different exit scenarios and see stakeholder returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="exitValue">Exit Value ($)</Label>
              <Input
                id="exitValue"
                type="number"
                value={exitValue}
                onChange={(e) => setExitValue(Number.parseFloat(e.target.value) || 0)}
                placeholder="50000000"
                step="1000000"
              />
            </div>
            <div className="flex gap-2">
              {[25, 50, 100, 200].map((million) => (
                <Button key={million} variant="outline" size="sm" onClick={() => setExitValue(million * 1000000)}>
                  ${million}M
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Exit Value</span>
                </div>
                <p className="text-2xl font-bold">${(exitValue / 1000000).toFixed(1)}M</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Multiple</span>
                </div>
                <p className="text-2xl font-bold">{(exitValue / currentValuation).toFixed(1)}x</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Stakeholders</span>
                </div>
                <p className="text-2xl font-bold">{mockStakeholders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Total Shares</span>
                </div>
                <p className="text-2xl font-bold">{(totalShares / 1000000).toFixed(1)}M</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="waterfall" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waterfall">Waterfall Analysis</TabsTrigger>
          <TabsTrigger value="scenarios">Multiple Scenarios</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle>Liquidation Waterfall</CardTitle>
              <CardDescription>How proceeds are distributed to each stakeholder</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Calculating returns...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculateExitScenario.stakeholderReturns.map((stakeholder, index) => {
                    const stakeholderInfo = mockStakeholders.find((s) => s.id === stakeholder.stakeholderId)
                    return (
                      <div
                        key={stakeholder.stakeholderId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{stakeholderInfo?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {stakeholder.shares.toLocaleString()} shares ({stakeholder.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${(stakeholder.payout / 1000000).toFixed(2)}M</p>
                          {stakeholder.multiple > 0 && (
                            <Badge variant="secondary">{stakeholder.multiple.toFixed(1)}x return</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Exit Scenarios</CardTitle>
              <CardDescription>Compare returns across different exit multiples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={multipleScenarios}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="multiple" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      formatter={(value: any) => [`$${(value / 1000000).toFixed(2)}M`, "Return"]}
                      labelFormatter={(label) => `Exit Multiple: ${label}`}
                    />
                    {mockStakeholders.map((stakeholder, index) => (
                      <Line
                        key={stakeholder.id}
                        type="monotone"
                        dataKey={stakeholder.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Proceeds Distribution</CardTitle>
              <CardDescription>Visual breakdown of exit proceeds by stakeholder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${(value / 1000000).toFixed(2)}M`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(item.value / 1000000).toFixed(2)}M</p>
                        <p className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
