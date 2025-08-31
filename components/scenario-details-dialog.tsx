"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateScenarioOutcomes } from "@/lib/scenario-calculations"

interface ScenarioDetailsDialogProps {
  scenario: any
  shareholders: any[]
  equityGrants: any[]
  fundingRounds: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScenarioDetailsDialog({
  scenario,
  shareholders,
  equityGrants,
  fundingRounds,
  open,
  onOpenChange,
}: ScenarioDetailsDialogProps) {
  // Calculate scenario outcomes
  const outcomes = calculateScenarioOutcomes(scenario, shareholders, equityGrants, fundingRounds)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{scenario.name}</DialogTitle>
              <DialogDescription>{scenario.description}</DialogDescription>
            </div>
            <Badge variant="secondary" className={getScenarioTypeColor(scenario.scenario_type)}>
              {scenario.scenario_type.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scenario Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {scenario.scenario_type === "exit" && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Exit Valuation</div>
                      <div className="text-lg font-semibold">${(scenario.exit_valuation / 1000000).toFixed(0)}M</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Liquidation Preference</div>
                      <div className="text-lg font-semibold">{scenario.liquidation_preference_multiple}x</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Proceeds</div>
                      <div className="text-lg font-semibold">${(outcomes.totalProceeds / 1000000).toFixed(1)}M</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Common Proceeds</div>
                      <div className="text-lg font-semibold">${(outcomes.commonProceeds / 1000000).toFixed(1)}M</div>
                    </div>
                  </>
                )}
                {scenario.scenario_type === "funding_round" && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Investment Amount</div>
                      <div className="text-lg font-semibold">
                        ${(scenario.new_investment_amount / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Pre-Money Valuation</div>
                      <div className="text-lg font-semibold">
                        ${(scenario.new_pre_money_valuation / 1000000).toFixed(0)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Post-Money Valuation</div>
                      <div className="text-lg font-semibold">
                        ${((scenario.new_pre_money_valuation + scenario.new_investment_amount) / 1000000).toFixed(0)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Dilution</div>
                      <div className="text-lg font-semibold">{outcomes.dilutionPercentage.toFixed(1)}%</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shareholder Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle>Shareholder Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shareholder</TableHead>
                      <TableHead>Current Ownership</TableHead>
                      <TableHead>New Ownership</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead>Return Multiple</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outcomes.shareholderOutcomes.map((outcome: any) => (
                      <TableRow key={outcome.shareholderId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{outcome.shareholderName}</div>
                            <div className="text-sm text-gray-500">{outcome.shareholderType}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{outcome.currentOwnership.toFixed(2)}%</TableCell>
                        <TableCell className="font-mono">
                          <span
                            className={
                              outcome.newOwnership < outcome.currentOwnership ? "text-red-600" : "text-green-600"
                            }
                          >
                            {outcome.newOwnership.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">${(outcome.payout / 1000000).toFixed(2)}M</TableCell>
                        <TableCell className="font-mono">
                          {outcome.returnMultiple > 0 ? `${outcome.returnMultiple.toFixed(1)}x` : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
