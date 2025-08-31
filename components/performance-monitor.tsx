"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { capTableCalculator } from "@/lib/optimized-calculations"

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const performanceMetrics = capTableCalculator.getPerformanceMetrics()
      const cacheStats = capTableCalculator.getCacheStats()

      setMetrics({
        ...performanceMetrics,
        ...cacheStats,
      })
    }

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [])

  if (!metrics || !isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
        >
          Performance
        </button>
      </div>
    )
  }

  const getPerformanceColor = (time: number) => {
    if (time < 100) return "text-green-600"
    if (time < 500) return "text-yellow-600"
    return "text-red-600"
  }

  const cacheHitRate =
    metrics.cacheHits + metrics.cacheMisses > 0
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
      : 0

  return (
    <div className="fixed bottom-4 right-4 w-80">
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
            <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white text-xs">
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span>Last Calculation:</span>
            <Badge variant="outline" className={`${getPerformanceColor(metrics.calculationTime)} border-current`}>
              {metrics.calculationTime.toFixed(0)}ms
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Cache Hit Rate:</span>
              <span>{cacheHitRate.toFixed(0)}%</span>
            </div>
            <Progress value={cacheHitRate} className="h-1" />
          </div>

          <div className="flex justify-between">
            <span>Cache Status:</span>
            <Badge variant={metrics.isValid ? "default" : "destructive"}>{metrics.isValid ? "Valid" : "Expired"}</Badge>
          </div>

          <div className="flex justify-between text-gray-400">
            <span>Hits: {metrics.cacheHits}</span>
            <span>Misses: {metrics.cacheMisses}</span>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between">
              <span>Target: &lt;1000ms</span>
              <Badge variant={metrics.calculationTime < 1000 ? "default" : "destructive"}>
                {metrics.calculationTime < 1000 ? "✓ Met" : "✗ Exceeded"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
