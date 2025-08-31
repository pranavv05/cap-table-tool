"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useErrorHandler } from "@/components/ui/error-boundary"

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetch: Date | null
}

export interface AsyncOperationOptions {
  retryCount?: number
  retryDelay?: number
  timeout?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * Custom React hook to manage async operations with loading, error, and retry logic.
 *
 * @template T
 * @param {() => Promise<T>} operation - The async function to execute.
 * @param {AsyncOperationOptions} [options] - Optional settings for retries, timeout, and callbacks.
 * @returns {{
 *   state: AsyncState<T>,
 *   execute: () => Promise<void>,
 *   reset: () => void
 * }}
 *
 * @example
 * const { state, execute, reset } = useAsyncOperation(fetchData, { retryCount: 2 });
 */
export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
    onSuccess,
    onError
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  })

  const handleError = useErrorHandler()

  const execute = useCallback(async (attempt = 0): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      })

      const result = await Promise.race([operation(), timeoutPromise])
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastFetch: new Date()
      })

      onSuccess?.(result)
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      // Retry logic
      if (attempt < retryCount && !errorObj.message.includes('timeout')) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        return execute(attempt + 1)
      }

      // Final failure
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj.message
      }))

      handleError(errorObj)
      onError?.(errorObj)
      return null
    }
  }, [operation, retryCount, retryDelay, timeout, onSuccess, onError, handleError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastFetch: null
    })
  }, [])

  const retry = useCallback(() => {
    return execute()
  }, [execute])

  return {
    ...state,
    execute,
    reset,
    retry,
    isStale: state.lastFetch && Date.now() - state.lastFetch.getTime() > 300000 // 5 minutes
  }
}

// Specialized hooks for common patterns
export function useApiCall<T = any>(url: string, options: RequestInit = {}) {
  return useAsyncOperation<T>(
    () => fetch(url, options).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return res.json()
    })
  )
}

export function useDataFetch<T = any>(fetcher: () => Promise<T>, dependencies: any[] = []) {
  const operation = useAsyncOperation(fetcher)
  
  // Auto-execute when dependencies change
  React.useEffect(() => {
    operation.execute()
  }, dependencies)

  return operation
}

export default useAsyncOperation