"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2, Calculator, TrendingUp, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "spinner" | "skeleton" | "card" | "inline" | "page" | "financial"
  className?: string
  message?: string
  delay?: number
  children?: React.ReactNode
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ size = "md", variant = "spinner", className, message, delay = 0, children }, ref) => {
    const [showLoading, setShowLoading] = React.useState(delay === 0)

    React.useEffect(() => {
      if (delay > 0) {
        const timer = setTimeout(() => setShowLoading(true), delay)
        return () => clearTimeout(timer)
      }
    }, [delay])

    if (!showLoading) return null

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6", 
      lg: "h-8 w-8",
      xl: "h-12 w-12"
    }

    const containerSizes = {
      sm: "h-16",
      md: "h-24",
      lg: "h-32", 
      xl: "h-48"
    }

    if (variant === "spinner") {
      return (
        <div ref={ref} className={cn("flex items-center justify-center", className)}>
          <div className="flex items-center gap-2">
            <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>
      )
    }

    if (variant === "skeleton") {
      return (
        <div ref={ref} className={cn("animate-pulse", className)}>
          {children || (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          )}
        </div>
      )
    }

    if (variant === "card") {
      return (
        <Card ref={ref} className={cn("border-dashed", className)}>
          <CardContent className={cn("flex items-center justify-center", containerSizes[size])}>
            <div className="text-center space-y-2">
              <Loader2 className={cn("animate-spin text-primary mx-auto", sizeClasses[size])} />
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (variant === "inline") {
      return (
        <span ref={ref} className={cn("inline-flex items-center gap-1", className)}>
          <Loader2 className={cn("animate-spin", sizeClasses[size])} />
          {message && <span className="text-sm">{message}</span>}
        </span>
      )
    }

    if (variant === "page") {
      return (
        <div ref={ref} className={cn("min-h-screen flex items-center justify-center bg-background", className)}>
          <div className="text-center space-y-4">
            <Loader2 className={cn("animate-spin text-primary mx-auto", sizeClasses[size])} />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Loading</h3>
              {message && <p className="text-muted-foreground">{message}</p>}
            </div>
          </div>
        </div>
      )
    }

    if (variant === "financial") {
      const [currentIcon, setCurrentIcon] = React.useState(0)
      const icons = [Calculator, TrendingUp, BarChart3]
      
      React.useEffect(() => {
        const interval = setInterval(() => {
          setCurrentIcon((prev) => (prev + 1) % icons.length)
        }, 1000)
        return () => clearInterval(interval)
      }, [])

      const Icon = icons[currentIcon]

      return (
        <div ref={ref} className={cn("flex items-center justify-center", className)}>
          <div className="text-center space-y-4">
            <div className="relative">
              <Icon className={cn("text-primary mx-auto animate-pulse", sizeClasses[size])} />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Calculating</h3>
              <p className="text-muted-foreground">
                {message || "Crunching complex financial scenarios..."}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }
)

Loading.displayName = "Loading"

// Skeleton variants for specific use cases
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-4 bg-muted rounded flex-1 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
)

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={cn("bg-muted rounded-lg animate-pulse flex items-center justify-center", height)}>
    <BarChart3 className="h-8 w-8 text-muted-foreground" />
  </div>
)

export const CardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
      <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
    </CardContent>
  </Card>
)

export { Loading }