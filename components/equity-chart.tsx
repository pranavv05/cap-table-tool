"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface EquityChartProps {
  equityGrants: any[]
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"]

export function EquityChart({ equityGrants }: EquityChartProps) {
  // Group grants by shareholder and calculate totals
  const shareholderTotals = equityGrants.reduce(
    (acc, grant) => {
      const shareholderName = grant.shareholders?.name || "Unknown"
      if (!acc[shareholderName]) {
        acc[shareholderName] = 0
      }
      acc[shareholderName] += grant.shares_granted || 0
      return acc
    },
    {} as Record<string, number>,
  )

  // Convert to chart data
  const chartData = Object.entries(shareholderTotals).map(([name, shares]) => ({
    name,
    value: shares,
    percentage: 0, // Will be calculated below
  }))

  // Calculate percentages
  const totalShares = chartData.reduce((sum, item) => sum + item.value, 0)
  chartData.forEach((item) => {
    item.percentage = totalShares > 0 ? (item.value / totalShares) * 100 : 0
  })

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} shares ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">No equity data to display</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-sm">
                      {value} ({entry.payload?.percentage.toFixed(1)}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
