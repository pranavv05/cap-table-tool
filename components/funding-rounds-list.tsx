"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateFundingRoundDialog } from "@/components/create-funding-round-dialog"

interface FundingRoundsListProps {
  companyId: string
  fundingRounds: any[]
}

export function FundingRoundsList({ companyId, fundingRounds }: FundingRoundsListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const getRoundTypeColor = (type: string) => {
    switch (type) {
      case "seed":
        return "bg-green-100 text-green-800"
      case "series_a":
        return "bg-blue-100 text-blue-800"
      case "series_b":
        return "bg-purple-100 text-purple-800"
      case "series_c":
        return "bg-orange-100 text-orange-800"
      case "bridge":
        return "bg-yellow-100 text-yellow-800"
      case "convertible":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (isCompleted: boolean) => {
    return isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Funding Rounds</CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Round
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valuation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundingRounds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No funding rounds yet. Create your first round to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  fundingRounds.map((round) => (
                    <TableRow key={round.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{round.round_name}</div>
                          {round.lead_investor && (
                            <div className="text-sm text-gray-500">Led by {round.lead_investor}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getRoundTypeColor(round.round_type)}>
                          {round.round_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">${(round.total_investment / 1000000).toFixed(1)}M</TableCell>
                      <TableCell className="font-mono">
                        {round.post_money_valuation ? `$${(round.post_money_valuation / 1000000).toFixed(1)}M` : "TBD"}
                      </TableCell>
                      <TableCell>
                        {round.closing_date ? new Date(round.closing_date).toLocaleDateString() : "TBD"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(round.is_completed)}>
                          {round.is_completed ? "Completed" : "In Progress"}
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
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

      <CreateFundingRoundDialog companyId={companyId} open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  )
}
