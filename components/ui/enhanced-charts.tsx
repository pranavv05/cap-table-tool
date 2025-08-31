"use client"

import React from "react"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Enhanced color palette for financial data visualization
export const CHART_COLORS = {
  primary: {
    founders: "#3b82f6",    // Blue
    employees: "#10b981",   // Green
    investors: "#f59e0b",   // Amber
    optionPool: "#8b5cf6",  // Purple
    preferred: "#ef4444",   // Red
    common: "#6b7280",      // Gray
  },
  secondary: {
    founders: "#60a5fa",
    employees: "#34d399", 
    investors: "#fbbf24",
    optionPool: "#a78bfa",
    preferred: "#f87171",
    common: "#9ca3af",
  },
  gradients: {
    founders: ["#3b82f6", "#1d4ed8"],
    employees: ["#10b981", "#047857"],
    investors: ["#f59e0b", "#d97706"],
    optionPool: ["#8b5cf6", "#7c3aed"],
  }
}

// Custom tooltip component for enhanced styling
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: number, name: string) => string
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      {label && (
        <p className="font-medium text-foreground mb-2">{label}</p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-medium text-foreground">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Enhanced ownership distribution pie chart with animations and professional styling
 */
export function EnhancedOwnershipPieChart({
  data,
  title = "Ownership Distribution",
  description,
  height = 300,
  showLegend = true,
  className
}: {
  data: Array<{ name: string; value: number; color?: string; shares?: number }>
  title?: string
  description?: string
  height?: number
  showLegend?: boolean
  className?: string
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const enhancedData = data.map((item, index) => ({
    ...item,
    color: item.color || Object.values(CHART_COLORS.primary)[index % Object.values(CHART_COLORS.primary).length]
  }))

  const formatTooltipValue = (value: number, name: string) => {
    const item = enhancedData.find(d => d.name === name)
    const percentage = `${value.toFixed(1)}%`
    const shares = item?.shares ? ` (${item.shares.toLocaleString()} shares)` : ''
    return percentage + shares
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enhancedData}
                cx="50%"
                cy="50%"
                innerRadius={height > 250 ? 60 : 40}
                outerRadius={height > 250 ? 120 : 80}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {enhancedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={entry.color}
                    strokeWidth={activeIndex === index ? 3 : 1}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip formatter={formatTooltipValue} />}
                cursor={false}
              />
              {showLegend && (
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced area chart for ownership evolution over time
 */
export function EnhancedOwnershipEvolutionChart({
  data,
  title = "Ownership Evolution",
  description,
  height = 400,
  className
}: {
  data: Array<{
    round: string
    founders: number
    employees: number
    investors: number
    date?: string
  }>
  title?: string
  description?: string
  height?: number
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="foundersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary.founders} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary.founders} stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="employeesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary.employees} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary.employees} stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="investorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary.investors} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary.investors} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.5}
              />
              <XAxis 
                dataKey="round" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />}
                cursor={{ stroke: '#6b7280', strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="rect"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Area
                type="monotone"
                dataKey="investors"
                stackId="1"
                stroke={CHART_COLORS.primary.investors}
                fill="url(#investorsGradient)"
                strokeWidth={2}
                name="Investors"
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="employees"
                stackId="1"
                stroke={CHART_COLORS.primary.employees}
                fill="url(#employeesGradient)"
                strokeWidth={2}
                name="Employees (ESOP)"
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="founders"
                stackId="1"
                stroke={CHART_COLORS.primary.founders}
                fill="url(#foundersGradient)"
                strokeWidth={2}
                name="Founders"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced waterfall chart for exit analysis
 */
export function EnhancedExitWaterfallChart({
  data,
  title = "Exit Waterfall Analysis",
  description,
  height = 400,
  className
}: {
  data: Array<{
    name: string
    liquidationPreference: number
    proRataProceeds: number
    total: number
  }>
  title?: string
  description?: string
  height?: number
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />}
                cursor={{ stroke: '#6b7280', strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="rect"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Bar
                dataKey="liquidationPreference" 
                stackId="a"
                fill={CHART_COLORS.primary.preferred}
                name="Liquidation Preference"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="proRataProceeds" 
                stackId="a"
                fill={CHART_COLORS.primary.common}
                name="Pro-Rata Proceeds"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced line chart for valuation trends
 */
export function EnhancedValuationTrendChart({
  data,
  title = "Valuation Trend",
  description,
  height = 400,
  className
}: {
  data: Array<{
    round: string
    preMoneyValuation: number
    postMoneyValuation: number
    date?: string
  }>
  title?: string
  description?: string
  height?: number
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.5}
              />
              <XAxis 
                dataKey="round" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />}
                cursor={{ stroke: '#6b7280', strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="line"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Line
                type="monotone"
                dataKey="preMoneyValuation"
                stroke={CHART_COLORS.primary.founders}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.primary.founders, strokeWidth: 2, r: 6 }}
                name="Pre-Money Valuation"
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="postMoneyValuation"
                stroke={CHART_COLORS.primary.investors}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.primary.investors, strokeWidth: 2, r: 6 }}
                name="Post-Money Valuation"
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}