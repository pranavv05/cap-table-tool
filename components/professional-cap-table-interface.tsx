"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Loading, ChartSkeleton, TableSkeleton } from "@/components/ui/loading"
import { SectionErrorBoundary, ComponentErrorBoundary } from "@/components/ui/error-boundary"
import {
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Info,
  Keyboard,
  History,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Download,
  FileDown,
} from "lucide-react"
import {
  exportOwnershipCSV,
  exportShareholdersCSV,
  exportFundingRoundsCSV,
  exportCompleteCapTableCSV,
  exportOwnershipPDF,
  exportShareholdersPDF,
  exportFundingRoundsPDF,
  exportCompleteCapTablePDF,
  type ExportData
} from "@/lib/export-utils"

interface Company {
  id: string
  name: string
  legal_name: string
  incorporation_date: string
  total_authorized_shares: number
  par_value: number
}

interface Shareholder {
  id: string
  name: string
  email: string
  shareholder_type: string
  equity_grants: EquityGrant[]
}

interface EquityGrant {
  id: string
  grant_type: string
  shares_granted: number
  exercise_price: number
  vesting_schedule: any
  is_active: boolean
}

interface FundingRound {
  id: string
  round_name: string
  round_type: string
  investment_amount: number
  pre_money_valuation?: number
  post_money_valuation?: number
  closing_date: string
  terms: any
}

interface Scenario {
  id: string
  name: string
  scenario_type: string
  assumptions: any
  results: any
}

interface ProfessionalCapTableInterfaceProps {
  company: Company
  shareholders: Shareholder[]
  equityGrants: EquityGrant[]
  fundingRounds: FundingRound[]
  scenarios: Scenario[]
}

export default function ProfessionalCapTableInterface({
  company,
  shareholders,
  equityGrants,
  fundingRounds,
  scenarios,
}: ProfessionalCapTableInterfaceProps) {
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false)
  const [exitValue, setExitValue] = useState(100000000)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [loadingStates, setLoadingStates] = useState({
    ownership: false,
    dilution: false,
    exits: false,
    audit: false,
  })
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({})

  // Accessibility: Announce loading states to screen readers
  const [ariaLiveMessage, setAriaLiveMessage] = useState('')

  useEffect(() => {
    const loadingMessages = Object.entries(loadingStates)
      .filter(([_, isLoading]) => isLoading)
      .map(([section, _]) => `Loading ${section} data`)
    
    if (loadingMessages.length > 0) {
      setAriaLiveMessage(loadingMessages.join(', '))
    } else {
      setAriaLiveMessage('')
    }
  }, [loadingStates])

  // Calculate ownership data from real data with error handling
  const { ownershipData, totalShares, founderShares, employeeShares, investorShares } = React.useMemo(() => {
    try {
      const calculatedTotalShares = equityGrants.reduce((sum, grant) => sum + grant.shares_granted, 0)
      
      const calculatedFounderShares = equityGrants
        .filter(
          (grant) =>
            shareholders.find((s) => s.equity_grants.some((g) => g.id === grant.id))?.shareholder_type === "founder",
        )
        .reduce((sum, grant) => sum + grant.shares_granted, 0)

      const calculatedEmployeeShares = equityGrants
        .filter(
          (grant) =>
            shareholders.find((s) => s.equity_grants.some((g) => g.id === grant.id))?.shareholder_type === "employee",
        )
        .reduce((sum, grant) => sum + grant.shares_granted, 0)

      const calculatedInvestorShares = equityGrants
        .filter(
          (grant) =>
            shareholders.find((s) => s.equity_grants.some((g) => g.id === grant.id))?.shareholder_type === "investor",
        )
        .reduce((sum, grant) => sum + grant.shares_granted, 0)

      const calculatedOwnershipData = [
        {
          name: "Founders",
          value: calculatedTotalShares > 0 ? (calculatedFounderShares / calculatedTotalShares) * 100 : 0,
          color: "#15803d",
          shares: calculatedFounderShares,
        },
        {
          name: "Employees (ESOP)",
          value: calculatedTotalShares > 0 ? (calculatedEmployeeShares / calculatedTotalShares) * 100 : 0,
          color: "#84cc16",
          shares: calculatedEmployeeShares,
        },
        {
          name: "Investors",
          value: calculatedTotalShares > 0 ? (calculatedInvestorShares / calculatedTotalShares) * 100 : 0,
          color: "#6366f1",
          shares: calculatedInvestorShares,
        },
      ]

      return {
        ownershipData: calculatedOwnershipData,
        totalShares: calculatedTotalShares,
        founderShares: calculatedFounderShares,
        employeeShares: calculatedEmployeeShares,
        investorShares: calculatedInvestorShares,
      }
    } catch (error) {
      console.error('Error calculating ownership data:', error)
      return {
        ownershipData: [],
        totalShares: 0,
        founderShares: 0,
        employeeShares: 0,
        investorShares: 0,
      }
    }
  }, [equityGrants, shareholders])

  const { totalRaised, currentValuation } = React.useMemo(() => {
    try {
      const calculatedTotalRaised = fundingRounds.reduce((sum, round) => sum + round.investment_amount, 0)
      const calculatedCurrentValuation =
        fundingRounds.length > 0
          ? Math.max(...fundingRounds.map((r) => r.post_money_valuation || r.pre_money_valuation || 0))
          : company.total_authorized_shares * company.par_value
      
      return {
        totalRaised: calculatedTotalRaised,
        currentValuation: calculatedCurrentValuation,
      }
    } catch (error) {
      console.error('Error calculating financial metrics:', error)
      return {
        totalRaised: 0,
        currentValuation: 0,
      }
    }
  }, [fundingRounds, company])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "a":
            e.preventDefault()
            setAuditDrawerOpen(true)
            break
          case "k":
            e.preventDefault()
            setShowKeyboardShortcuts(true)
            break
          case "h":
            e.preventDefault()
            // Focus on funding history
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const calculateExitReturns = (valuation: number) => {
    return ownershipData.map((stakeholder) => ({
      ...stakeholder,
      exitValue: (valuation * stakeholder.value) / 100,
      multiple: currentValuation > 0 ? valuation / currentValuation : 1,
    }))
  }

  // Export functions
  const prepareExportData = (): ExportData => {
    return {
      company,
      shareholders,
      equityGrants,
      fundingRounds,
      ownershipData,
      totalShares,
      totalRaised,
      currentValuation
    }
  }

  const handleExportOwnershipCSV = () => {
    const exportData = prepareExportData()
    exportOwnershipCSV(exportData)
  }

  const handleExportShareholdersCSV = () => {
    const exportData = prepareExportData()
    exportShareholdersCSV(exportData)
  }

  const handleExportFundingRoundsCSV = () => {
    const exportData = prepareExportData()
    exportFundingRoundsCSV(exportData)
  }

  const handleExportCompleteCSV = () => {
    const exportData = prepareExportData()
    exportCompleteCapTableCSV(exportData)
  }

  const handleExportOwnershipPDF = () => {
    const exportData = prepareExportData()
    exportOwnershipPDF(exportData)
  }

  const handleExportShareholdersPDF = () => {
    const exportData = prepareExportData()
    exportShareholdersPDF(exportData)
  }

  const handleExportFundingRoundsPDF = () => {
    const exportData = prepareExportData()
    exportFundingRoundsPDF(exportData)
  }

  const handleExportCompletePDF = () => {
    const exportData = prepareExportData()
    exportCompleteCapTablePDF(exportData)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-6 space-y-6" role="main" aria-label="Cap table management interface">
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {ariaLiveMessage}
        </div>
        
        {/* Header with Quick Actions */}
        <header className="flex items-center justify-between" role="banner">
          <div>
            <h1 className="text-3xl font-bold text-foreground" id="cap-table-title">
              {company.name} Cap Table
            </h1>
            <p className="text-muted-foreground" aria-describedby="cap-table-title">
              Professional equity management for founders and investors
            </p>
          </div>
          <div className="flex items-center gap-3" role="toolbar" aria-label="Cap table actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  aria-label="Export cap table data"
                  aria-expanded={false}
                  aria-haspopup="menu"
                >
                  <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" role="menu" aria-label="Export options">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCompleteCSV} role="menuitem">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Complete Cap Table (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCompletePDF} role="menuitem">
                  <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
                  Complete Cap Table (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportOwnershipCSV} role="menuitem">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ownership Summary (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportOwnershipPDF} role="menuitem">
                  <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ownership Summary (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportShareholdersCSV} role="menuitem">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Shareholders (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportShareholdersPDF} role="menuitem">
                  <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
                  Shareholders (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportFundingRoundsCSV} role="menuitem">
                  <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                  Funding Rounds (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportFundingRoundsPDF} role="menuitem">
                  <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
                  Funding Rounds (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowKeyboardShortcuts(true)}
                  aria-label="Show keyboard shortcuts"
                >
                  <Keyboard className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts (⌘K)</TooltipContent>
            </Tooltip>
            <Button 
              onClick={() => setAuditDrawerOpen(true)} 
              variant="outline"
              aria-label="Open mathematical audit panel"
            >
              <Calculator className="h-4 w-4 mr-2" aria-hidden="true" />
              Audit Math
            </Button>
          </div>
        </header>

        {/* Key Metrics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4" aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">Key Financial Metrics</h2>
          <Card role="region" aria-labelledby="valuation-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" id="valuation-metric">Current Valuation</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" aria-describedby="valuation-metric">
                ${(currentValuation / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                {fundingRounds.length > 0 ? "Latest round" : "Authorized shares"}
              </p>
            </CardContent>
          </Card>
          <Card role="region" aria-labelledby="raised-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" id="raised-metric">Total Raised</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" aria-describedby="raised-metric">
                ${(totalRaised / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Across {fundingRounds.length} rounds</p>
            </CardContent>
          </Card>
          <Card role="region" aria-labelledby="founder-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" id="founder-metric">Founder Ownership</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" aria-describedby="founder-metric">
                {ownershipData[0].value.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{founderShares.toLocaleString()} shares</p>
            </CardContent>
          </Card>
          <Card role="region" aria-labelledby="esop-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" id="esop-metric">ESOP Pool</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" aria-describedby="esop-metric">
                {ownershipData[1].value.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{employeeShares.toLocaleString()} shares</p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="history" className="space-y-6" aria-label="Cap table data views">
          <TabsList className="grid w-full grid-cols-4" role="tablist">
            <TabsTrigger value="history" role="tab" aria-controls="history-panel">Funding History</TabsTrigger>
            <TabsTrigger value="ownership" role="tab" aria-controls="ownership-panel">Ownership</TabsTrigger>
            <TabsTrigger value="dilution" role="tab" aria-controls="dilution-panel">Dilution Analysis</TabsTrigger>
            <TabsTrigger value="exits" role="tab" aria-controls="exits-panel">Exit Scenarios</TabsTrigger>
          </TabsList>

          {/* Funding History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Funding Timeline
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chronological view of all funding rounds with inline math previews</p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>Track your company's funding journey with detailed round information</CardDescription>
              </CardHeader>
              <CardContent>
                <SectionErrorBoundary>
                  <div className="space-y-4">
                    {fundingRounds.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No funding rounds yet.{" "}
                        <a href="/funding-rounds" className="text-primary hover:underline">
                          Add your first round
                        </a>
                      </div>
                    ) : (
                      fundingRounds.map((round, index) => (
                        <ComponentErrorBoundary key={round.id}>
                          <div className="relative">
                            {index < fundingRounds.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
                            )}
                            <Card
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedRound(selectedRound === round.id ? null : round.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{round.round_name}</h3>
                                        <Badge variant={round.round_type === "SAFE" ? "secondary" : "default"}>
                                          {round.round_type}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(round.closing_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">${(round.investment_amount / 1000000).toFixed(1)}M</div>
                                    <div className="text-sm text-muted-foreground">
                                      $
                                      {((round.post_money_valuation || round.pre_money_valuation || 0) / 1000000).toFixed(
                                        1,
                                      )}
                                      M valuation
                                    </div>
                                  </div>
                                  {selectedRound === round.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </div>

                                {selectedRound === round.id && (
                                  <div className="mt-4 pt-4 border-t space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Investment:</span>
                                        <div className="font-medium">
                                          ${(round.investment_amount / 1000000).toFixed(1)}M
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Pre-money:</span>
                                        <div className="font-medium">
                                          ${((round.pre_money_valuation || 0) / 1000000).toFixed(1)}M
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Post-money:</span>
                                        <div className="font-medium">
                                          ${((round.post_money_valuation || 0) / 1000000).toFixed(1)}M
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <div className="font-medium">{round.round_type}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </ComponentErrorBoundary>
                      ))
                    )}
                  </div>
                </SectionErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ownership Tab */}
          <TabsContent value="ownership" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Ownership Distribution</CardTitle>
                  <CardDescription>Breakdown by stakeholder type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComponentErrorBoundary>
                    <ChartContainer
                      config={{
                        founders: { label: "Founders", color: "#15803d" },
                        employees: { label: "Employees", color: "#84cc16" },
                        investors: { label: "Investors", color: "#6366f1" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ownershipData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {ownershipData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </ComponentErrorBoundary>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stakeholder Details</CardTitle>
                  <CardDescription>Detailed breakdown with share counts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ownershipData.map((stakeholder, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stakeholder.color }} />
                          <div>
                            <div className="font-medium">{stakeholder.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {stakeholder.shares.toLocaleString()} shares
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{stakeholder.value.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            ${((currentValuation * stakeholder.value) / 100 / 1000000).toFixed(1)}M value
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dilution Analysis Tab */}
          <TabsContent value="dilution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ownership Analysis</CardTitle>
                <CardDescription>Current ownership structure and potential dilution scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Dilution analysis will be available after multiple funding rounds.
                  <br />
                  <a href="/scenarios" className="text-primary hover:underline">
                    Create scenarios
                  </a>{" "}
                  to model future dilution.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exit Scenarios Tab */}
          <TabsContent value="exits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exit Value Calculator</CardTitle>
                <CardDescription>Model different exit scenarios and returns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Label htmlFor="exit-value">Exit Valuation:</Label>
                  <Input
                    id="exit-value"
                    type="number"
                    value={exitValue}
                    onChange={(e) => setExitValue(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">USD</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {calculateExitReturns(exitValue).map((stakeholder, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stakeholder.color }} />
                          <span className="font-medium">{stakeholder.name}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-primary">
                            ${(stakeholder.exitValue / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-sm text-muted-foreground">{stakeholder.value.toFixed(1)}% ownership</div>
                          <div className="text-sm text-muted-foreground">
                            {stakeholder.multiple.toFixed(1)}x multiple
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Audit Drawer */}
        <Sheet open={auditDrawerOpen} onOpenChange={setAuditDrawerOpen}>
          <SheetContent className="w-[600px] sm:w-[800px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Mathematical Audit Trail
              </SheetTitle>
              <SheetDescription>Detailed calculations and assumptions for each funding round</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {fundingRounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No funding rounds to audit yet.</div>
              ) : (
                fundingRounds.map((round) => (
                  <Card key={round.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {round.round_name} - {round.round_type} Round
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Investment Amount:</span>
                          <div>${round.investment_amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Post-money Valuation:</span>
                          <div>${(round.post_money_valuation || 0).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Round Calculations:</h4>
                        <div className="text-sm space-y-1">
                          <div>• Investment: ${round.investment_amount.toLocaleString()}</div>
                          <div>• Pre-money: ${(round.pre_money_valuation || 0).toLocaleString()}</div>
                          <div>• Post-money: ${(round.post_money_valuation || 0).toLocaleString()}</div>
                          <div>
                            • Investor Ownership:{" "}
                            {round.post_money_valuation
                              ? ((round.investment_amount / round.post_money_valuation) * 100).toFixed(1)
                              : 0}
                            %
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Keyboard Shortcuts Modal */}
        <Sheet open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Keyboard Shortcuts</SheetTitle>
              <SheetDescription>Speed up your workflow with these shortcuts</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Open Audit Drawer</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm">⌘ A</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Show Shortcuts</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm">⌘ K</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Focus Funding History</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm">⌘ H</kbd>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
