"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  header: string
  accessor: (item: any) => React.ReactNode
  className?: string
  sortable?: boolean
  mobileHidden?: boolean
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  className?: string
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
  expandableRows?: boolean
  renderExpandedContent?: (item: any) => React.ReactNode
  emptyState?: React.ReactNode
  loading?: boolean
}

export function ResponsiveTable({
  columns,
  data,
  className,
  mobileBreakpoint = 'md',
  expandableRows = true,
  renderExpandedContent,
  emptyState,
  loading = false
}: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Filter columns for mobile view
  const mobileColumns = columns.filter(col => !col.mobileHidden)
  const primaryColumn = mobileColumns[0]
  const secondaryColumns = mobileColumns.slice(1)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        {emptyState || (
          <div>
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={cn(`hidden ${mobileBreakpoint}:block`, className)}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="table">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="h-auto p-0 font-medium"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {sortColumn === column.key && (
                          <span className="ml-1" aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr 
                  key={item.id || index} 
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 text-sm", column.className)}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className={cn(`block ${mobileBreakpoint}:hidden space-y-3`, className)}>
        {data.map((item, index) => {
          const rowId = item.id || index.toString()
          const isExpanded = expandedRows.has(rowId)
          
          return (
            <Card key={rowId} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className={cn(
                    "p-4 flex items-center justify-between",
                    expandableRows && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => expandableRows && toggleRowExpansion(rowId)}
                  role={expandableRows ? "button" : undefined}
                  aria-expanded={expandableRows ? isExpanded : undefined}
                  aria-controls={expandableRows ? `row-details-${rowId}` : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {primaryColumn.accessor(item)}
                    </div>
                    {secondaryColumns.length > 0 && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {secondaryColumns[0].accessor(item)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {secondaryColumns.length > 1 && (
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {secondaryColumns[1].accessor(item)}
                        </div>
                        {secondaryColumns[2] && (
                          <div className="text-xs text-muted-foreground">
                            {secondaryColumns[2].accessor(item)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {expandableRows && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-auto"
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {expandableRows && isExpanded && (
                  <div 
                    id={`row-details-${rowId}`}
                    className="border-t border-border p-4 bg-muted/30"
                    role="region"
                    aria-label={`Details for ${primaryColumn.accessor(item)}`}
                  >
                    {renderExpandedContent ? (
                      renderExpandedContent(item)
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {secondaryColumns.slice(1).map((column) => (
                          <div key={column.key} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">
                              {column.header}:
                            </span>
                            <span className="text-sm text-foreground">
                              {column.accessor(item)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

export type { Column, ResponsiveTableProps }