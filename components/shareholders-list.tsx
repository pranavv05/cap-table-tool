"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ShareholdersListProps {
  companyId: string
  shareholders: any[]
  equityGrants: any[]
}

export function ShareholdersList({ companyId, shareholders, equityGrants }: ShareholdersListProps) {
  const [selectedShareholder, setSelectedShareholder] = useState<string | null>(null)

  // Calculate total shares for percentage calculations
  const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

  // Group equity grants by shareholder
  const shareholderData = shareholders.map((shareholder) => {
    const grants = equityGrants.filter((grant) => grant.shareholder_id === shareholder.id)
    const totalSharesOwned = grants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const ownershipPercentage = totalShares > 0 ? (totalSharesOwned / totalShares) * 100 : 0

    return {
      ...shareholder,
      grants,
      totalSharesOwned,
      ownershipPercentage,
    }
  })

  const getShareholderTypeColor = (type: string) => {
    switch (type) {
      case "founder":
        return "bg-blue-100 text-blue-800"
      case "employee":
        return "bg-green-100 text-green-800"
      case "investor":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cap Table</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Shareholder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shareholder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Ownership %</TableHead>
                <TableHead>Grant Type</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareholderData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No shareholders added yet. Add your first shareholder to get started.
                  </TableCell>
                </TableRow>
              ) : (
                shareholderData.map((shareholder) => (
                  <TableRow key={shareholder.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{shareholder.name}</div>
                        {shareholder.email && <div className="text-sm text-gray-500">{shareholder.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getShareholderTypeColor(shareholder.shareholder_type)}>
                        {shareholder.shareholder_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{shareholder.totalSharesOwned.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{shareholder.ownershipPercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {shareholder.grants.map((grant: any) => (
                          <Badge key={grant.id} variant="outline" className="text-xs">
                            {grant.grant_type.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
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
  )
}
