"use client"

import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: string
  header: string
  accessor: (item: T, index: number) => React.ReactNode
  width?: number
  className?: string
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  itemHeight?: number
  className?: string
  loading?: boolean
  empty?: React.ReactNode
  stickyHeader?: boolean
  onItemClick?: (item: T, index: number) => void
  getItemKey?: (item: T, index: number) => string | number
}

function VirtualizedTableLoadingSkeleton({ className }: { className?: string }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function VirtualizedTableEmpty({ 
  children, 
  className 
}: { 
  children?: React.ReactNode
  className?: string 
}) {
  if (!children) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("text-center py-8", className)}>
      <div className="text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

export function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 48,
  className,
  loading = false,
  empty,
  stickyHeader = true,
  onItemClick,
  getItemKey
}: VirtualizedTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const items = virtualizer.getVirtualItems()
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 150), 0)

  if (loading) {
    return <VirtualizedTableLoadingSkeleton className={className} />
  }

  if (data.length === 0) {
    return <VirtualizedTableEmpty className={className}>{empty}</VirtualizedTableEmpty>
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header */}
        {stickyHeader && (
          <div 
            className="sticky top-0 z-10 bg-background border-b border-border"
            style={{ minWidth: totalWidth }}
          >
            <div className="flex">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                    column.className
                  )}
                  style={{ 
                    width: column.width || 150,
                    minWidth: column.width || 150
                  }}
                >
                  {column.header}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Virtualized Content */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height }}
          role="table"
          aria-label="Virtualized data table"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
              minWidth: totalWidth
            }}
          >
            {items.map((virtualRow) => {
              const item = data[virtualRow.index]
              const rowKey = getItemKey ? getItemKey(item, virtualRow.index) : virtualRow.index
              
              return (
                <div
                  key={rowKey}
                  className={cn(
                    "absolute top-0 left-0 w-full flex border-b border-border hover:bg-muted/50 transition-colors",
                    onItemClick && "cursor-pointer"
                  )}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  onClick={() => onItemClick?.(item, virtualRow.index)}
                  role="row"
                  tabIndex={onItemClick ? 0 : -1}
                  onKeyDown={(e) => {
                    if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onItemClick(item, virtualRow.index)
                    }
                  }}
                  aria-rowindex={virtualRow.index + 1}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm flex items-center",
                        column.className
                      )}
                      style={{ 
                        width: column.width || 150,
                        minWidth: column.width || 150
                      }}
                      role="cell"
                    >
                      <div className="truncate w-full">
                        {column.accessor(item, virtualRow.index)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile variant for better mobile performance
interface VirtualizedMobileListProps<T> {
  data: T[]
  height?: number
  itemHeight?: number
  className?: string
  loading?: boolean
  empty?: React.ReactNode
  onItemClick?: (item: T, index: number) => void
  getItemKey?: (item: T, index: number) => string | number
  renderItem: (item: T, index: number) => React.ReactNode
}

function VirtualizedMobileListLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function VirtualizedMobileListEmpty({ 
  children, 
  className 
}: { 
  children?: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("text-center py-8", className)}>
      <div className="text-muted-foreground">
        {children || "No data available"}
      </div>
    </div>
  )
}

export function VirtualizedMobileList<T>({
  data,
  height = 400,
  itemHeight = 80,
  className,
  loading = false,
  empty,
  onItemClick,
  getItemKey,
  renderItem
}: VirtualizedMobileListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3,
  })

  const items = virtualizer.getVirtualItems()

  if (loading) {
    return <VirtualizedMobileListLoadingSkeleton className={className} />
  }

  if (data.length === 0) {
    return <VirtualizedMobileListEmpty className={className}>{empty}</VirtualizedMobileListEmpty>
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
      role="list"
      aria-label="Virtualized mobile list"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        {items.map((virtualRow) => {
          const item = data[virtualRow.index]
          const rowKey = getItemKey ? getItemKey(item, virtualRow.index) : virtualRow.index
          
          return (
            <div
              key={rowKey}
              className={cn(
                "absolute top-0 left-0 w-full px-4",
                onItemClick && "cursor-pointer"
              )}
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`
              }}
              onClick={() => onItemClick?.(item, virtualRow.index)}
              role="listitem"
              tabIndex={onItemClick ? 0 : -1}
              onKeyDown={(e) => {
                if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onItemClick(item, virtualRow.index)
                }
              }}
              aria-posinset={virtualRow.index + 1}
              aria-setsize={data.length}
            >
              <div className="h-full py-1.5">
                {renderItem(item, virtualRow.index)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}