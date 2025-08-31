"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home, Mail, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: "page" | "section" | "component"
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  level: "page" | "section" | "component"
  errorId: string | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error)
      console.error("Error info:", errorInfo)
    }

    // TODO: Log to error reporting service in production
    // Example: logErrorToService(error, errorInfo, this.state.errorId)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    const prevResetKeys = prevProps.resetKeys || []
    const currentResetKeys = resetKeys || []

    // Reset error if resetKeys changed
    if (
      this.state.hasError &&
      prevResetKeys.length !== currentResetKeys.length ||
      currentResetKeys.some((key, idx) => key !== prevResetKeys[idx])
    ) {
      this.resetError()
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          level={this.props.level || "component"}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError, 
  level, 
  errorId 
}) => {
  const [showDetails, setShowDetails] = React.useState(false)

  const getErrorMessage = () => {
    if (error?.message?.includes("fetch")) return "Network connection error"
    if (error?.message?.includes("permission")) return "Permission denied"
    if (error?.message?.includes("not found")) return "Resource not found"
    return "An unexpected error occurred"
  }

  const getErrorDescription = () => {
    if (error?.message?.includes("fetch")) 
      return "Please check your internet connection and try again."
    if (error?.message?.includes("permission")) 
      return "You don't have permission to access this resource."
    if (error?.message?.includes("not found")) 
      return "The requested resource could not be found."
    return "We're sorry for the inconvenience. The error has been logged and will be investigated."
  }

  if (level === "page") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardDescription>{getErrorDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === "development" && (
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    {showDetails ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    Error Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <div className="p-3 bg-muted rounded-md text-xs font-mono break-all">
                    <p><strong>Error ID:</strong> {errorId}</p>
                    <p><strong>Message:</strong> {error?.message}</p>
                    <p><strong>Stack:</strong> {error?.stack}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (level === "section") {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{getErrorMessage()}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>{getErrorDescription()}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={resetError}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                {process.env.NODE_ENV === "development" && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    Details
                  </Button>
                )}
              </div>
              
              {showDetails && process.env.NODE_ENV === "development" && (
                <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all">
                  <p><strong>Error ID:</strong> {errorId}</p>
                  <p><strong>Message:</strong> {error?.message}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Component level error
  return (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="font-medium">Component Error</span>
        <Button size="sm" variant="ghost" onClick={resetError}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Show details
          </summary>
          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
            {error?.message}
          </pre>
        </details>
      )}
    </div>
  )
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{ 
  children: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}> = ({ children, onError }) => (
  <ErrorBoundary level="section" onError={onError}>
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ 
  children: React.ReactNode
  resetKeys?: Array<string | number>
}> = ({ children, resetKeys }) => (
  <ErrorBoundary level="component" resetKeys={resetKeys}>
    {children}
  </ErrorBoundary>
)

// Hook for handling async errors in components
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: any) => {
    // Log error
    console.error("Async error caught:", error)
    
    // TODO: Report to error service
    // reportError(error, errorInfo)
    
    // For now, we could trigger a toast notification
    // toast.error("Something went wrong. Please try again.")
  }, [])
}

// Wrapper for async functions to handle errors
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError?: (error: Error) => void
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      onError?.(errorObj)
      throw errorObj
    }
  }
}

export { ErrorBoundary }
export type { ErrorBoundaryProps, ErrorFallbackProps }