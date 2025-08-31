"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SAFETerms {
  // Basic Terms
  investmentAmount: number
  valuationCap: number
  discountRate: number

  // Advanced Terms
  hasProRataRights: boolean
  hasMostFavoredNation: boolean
  hasLiquidationPreference: boolean
  liquidationMultiple: number

  // Conversion Terms
  conversionTrigger: "equity_financing" | "liquidity_event" | "maturity"
  maturityDate?: string

  // Investor Information
  investorName: string
  investorType: "individual" | "fund" | "strategic" | "other"

  // Additional Terms
  boardRights: boolean
  informationRights: boolean
  tagAlongRights: boolean
  dragAlongRights: boolean

  notes: string
}

export default function SAFERoundDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [terms, setTerms] = useState<SAFETerms>({
    investmentAmount: 0,
    valuationCap: 0,
    discountRate: 20,
    hasProRataRights: false,
    hasMostFavoredNation: true,
    hasLiquidationPreference: false,
    liquidationMultiple: 1,
    conversionTrigger: "equity_financing",
    investorName: "",
    investorType: "individual",
    boardRights: false,
    informationRights: true,
    tagAlongRights: false,
    dragAlongRights: false,
    notes: "",
  })

  const handleSubmit = async () => {
    setLoading(true)
    console.log("[v0] Creating SAFE round with terms:", terms)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setLoading(false)
    setOpen(false)
  }

  const getValuationCapGuidance = () => {
    if (terms.valuationCap < 5000000) return { color: "green", text: "Conservative - Good for early stage" }
    if (terms.valuationCap < 15000000) return { color: "blue", text: "Market rate - Industry median ~$10M" }
    return { color: "orange", text: "Aggressive - Ensure strong traction" }
  }

  const getDiscountGuidance = () => {
    if (terms.discountRate < 15) return { color: "orange", text: "Low discount - Consider increasing" }
    if (terms.discountRate <= 25) return { color: "green", text: "Standard range (15-25%)" }
    return { color: "red", text: "High discount - May signal desperation" }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create SAFE Round</DialogTitle>
          <DialogDescription>Configure your Simple Agreement for Future Equity terms</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Terms</CardTitle>
              <CardDescription>Core SAFE agreement terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    value={terms.investmentAmount}
                    onChange={(e) =>
                      setTerms((prev) => ({ ...prev, investmentAmount: Number.parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="250000"
                  />
                </div>
                <div>
                  <Label htmlFor="investorName">Investor Name</Label>
                  <Input
                    id="investorName"
                    value={terms.investorName}
                    onChange={(e) => setTerms((prev) => ({ ...prev, investorName: e.target.value }))}
                    placeholder="Acme Ventures"
                  />
                </div>
              </div>

              <div>
                <Label>Investor Type</Label>
                <RadioGroup
                  value={terms.investorType}
                  onValueChange={(value: any) => setTerms((prev) => ({ ...prev, investorType: value }))}
                  className="flex flex-wrap gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fund" id="fund" />
                    <Label htmlFor="fund">VC Fund</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strategic" id="strategic" />
                    <Label htmlFor="strategic">Strategic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valuation Terms</CardTitle>
              <CardDescription>Set valuation cap and discount rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="valuationCap">Valuation Cap ($)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum valuation at which SAFE converts to equity</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="valuationCap"
                  type="number"
                  value={terms.valuationCap}
                  onChange={(e) =>
                    setTerms((prev) => ({ ...prev, valuationCap: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="10000000"
                />
                {terms.valuationCap > 0 && (
                  <div className="mt-2">
                    <Badge variant={getValuationCapGuidance().color === "green" ? "default" : "secondary"}>
                      {getValuationCapGuidance().text}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Discount on future round price (typically 15-25%)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="discountRate"
                  type="number"
                  value={terms.discountRate}
                  onChange={(e) =>
                    setTerms((prev) => ({ ...prev, discountRate: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="20"
                  min="0"
                  max="50"
                />
                {terms.discountRate > 0 && (
                  <div className="mt-2">
                    <Badge variant={getDiscountGuidance().color === "green" ? "default" : "secondary"}>
                      {getDiscountGuidance().text}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Investor Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investor Rights</CardTitle>
              <CardDescription>Configure investor protections and rights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="proRataRights"
                      checked={terms.hasProRataRights}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, hasProRataRights: !!checked }))}
                    />
                    <Label htmlFor="proRataRights">Pro Rata Rights</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Right to maintain ownership % in future rounds</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mfn"
                      checked={terms.hasMostFavoredNation}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, hasMostFavoredNation: !!checked }))}
                    />
                    <Label htmlFor="mfn">Most Favored Nation</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Automatically get better terms if offered to others</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="informationRights"
                      checked={terms.informationRights}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, informationRights: !!checked }))}
                    />
                    <Label htmlFor="informationRights">Information Rights</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="boardRights"
                      checked={terms.boardRights}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, boardRights: !!checked }))}
                    />
                    <Label htmlFor="boardRights">Board Rights</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tagAlong"
                      checked={terms.tagAlongRights}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, tagAlongRights: !!checked }))}
                    />
                    <Label htmlFor="tagAlong">Tag-Along Rights</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dragAlong"
                      checked={terms.dragAlongRights}
                      onCheckedChange={(checked) => setTerms((prev) => ({ ...prev, dragAlongRights: !!checked }))}
                    />
                    <Label htmlFor="dragAlong">Drag-Along Rights</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Terms</CardTitle>
              <CardDescription>When and how the SAFE converts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Conversion Trigger</Label>
                <RadioGroup
                  value={terms.conversionTrigger}
                  onValueChange={(value: any) => setTerms((prev) => ({ ...prev, conversionTrigger: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equity_financing" id="equity_financing" />
                    <Label htmlFor="equity_financing">Equity Financing Round</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="liquidity_event" id="liquidity_event" />
                    <Label htmlFor="liquidity_event">Liquidity Event</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maturity" id="maturity" />
                    <Label htmlFor="maturity">Maturity Date</Label>
                  </div>
                </RadioGroup>
              </div>

              {terms.conversionTrigger === "maturity" && (
                <div>
                  <Label htmlFor="maturityDate">Maturity Date</Label>
                  <Input
                    id="maturityDate"
                    type="date"
                    value={terms.maturityDate || ""}
                    onChange={(e) => setTerms((prev) => ({ ...prev, maturityDate: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={terms.notes}
                onChange={(e) => setTerms((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional terms, conditions, or notes..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating SAFE..." : "Create SAFE Round"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
