"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Edit, Trash2, Eye, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateScenarioDialog } from "@/components/create-scenario-dialog"
import { ScenarioDetailsDialog } from "@/components/scenario-details-dialog"

interface ScenariosListProps {
  companyId: string
  scenarios: any[]
  shareholders: any[]
  equityGrants: any[]
  fundingRounds: any[]
}

export function ScenariosList({ companyId, scenarios, shareholders, equityGrants, fundingRounds }: ScenariosListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const getScenarioTypeColor = (type: string) => {
    switch (type) {
      case "exit":
        return "bg-green-100 text-green-800"
      case "funding_round":
        return "bg-blue-100 text-blue-800"
      case "option_pool_expansion":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleViewDetails = (scenario: any) => {
    setSelectedScenario(scenario)
    setShowDetailsDialog(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scenarios</CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valuation</TableHead>
                  <TableHead>Key Metric</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No scenarios created yet. Create your first scenario to start modeling outcomes.
                    </TableCell>
                  </TableRow>
                ) : (
                  scenarios.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {scenario.is_baseline && <Star className="h-4 w-4 text-yellow-500" />}
                          <div>
                            <div className="font-medium text-gray-900">{scenario.name}</div>
                            {scenario.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{scenario.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getScenarioTypeColor(scenario.scenario_type)}>
                          {scenario.scenario_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {scenario.exit_valuation
                          ? `$${(scenario.exit_valuation / 1000000).toFixed(0)}M`
                          : scenario.new_pre_money_valuation
                            ? `$${(scenario.new_pre_money_valuation / 1000000).toFixed(0)}M`
                            : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {scenario.scenario_type === "exit"
                          ? `${scenario.liquidation_preference_multiple || 1}x LP`
                          : scenario.scenario_type === "funding_round"
                            ? `$${(scenario.new_investment_amount / 1000000).toFixed(1)}M`
                            : `${(scenario.new_option_pool_percentage * 100).toFixed(1)}%`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={scenario.is_baseline ? "default" : "secondary"}>
                          {scenario.is_baseline ? "Baseline" : "Scenario"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(scenario)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Baseline
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateScenarioDialog companyId={companyId} open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {selectedScenario && (
        <ScenarioDetailsDialog
          scenario={selectedScenario}
          shareholders={shareholders}
          equityGrants={equityGrants}
          fundingRounds={fundingRounds}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </>
  )
}
