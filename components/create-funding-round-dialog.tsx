"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useErrorHandler } from "@/components/ui/error-boundary"

interface CreateFundingRoundDialogProps {
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FundingRoundData {
  roundName: string
  roundType: string
  roundStage: string
  // SAFE specific fields
  valuationCap: string
  discountRate: string
  mostFavoredNation: boolean
  // Priced round specific fields
  totalInvestment: string
  preMoneyValuation: string
  postMoneyValuation: string
  pricePerShare: string
  sharesIssued: string
  // ESOP fields
  esopTopUp: boolean
  esopPercentage: string
  esopShares: string
  // Founder secondary
  founderSecondary: boolean
  secondaryAmount: string
  secondaryFounders: string[]
  // Common fields
  closingDate: Date | undefined
  leadInvestor: string
  liquidationPreference: string
  participationRights: string
  antiDilutionRights: string
  dividendRate: string
  votingRights: boolean
  boardSeats: string
  proRataRights: boolean
  dragAlongRights: boolean
  tagAlongRights: boolean
  notes: string
}

export function CreateFundingRoundDialog({ companyId, open, onOpenChange }: CreateFundingRoundDialogProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const handleError = useErrorHandler()

  // Get the auth token when the component mounts
  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken()
      setAuthToken(token)
    }
    fetchToken()
  }, [getToken])
  const [formData, setFormData] = useState<FundingRoundData>({
    roundName: "",
    roundType: "safe", // Default to SAFE round
    roundStage: "pre-seed",
    // SAFE fields
    valuationCap: "",
    discountRate: "20",
    mostFavoredNation: false,
    // Priced round fields
    totalInvestment: "",
    preMoneyValuation: "",
    postMoneyValuation: "",
    pricePerShare: "",
    sharesIssued: "",
    // ESOP fields
    esopTopUp: false,
    esopPercentage: "",
    esopShares: "",
    // Founder secondary
    founderSecondary: false,
    secondaryAmount: "",
    secondaryFounders: [],
    // Common fields
    closingDate: undefined,
    leadInvestor: "",
    liquidationPreference: "1.0",
    participationRights: "non-participating",
    antiDilutionRights: "weighted_average_narrow",
    dividendRate: "0",
    votingRights: true,
    boardSeats: "0",
    proRataRights: true,
    dragAlongRights: true,
    tagAlongRights: true,
    notes: "",
  })

  const updateFormData = (field: keyof FundingRoundData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authToken) {
      setError("Please sign in to create a funding round")
      return
    }

    // Basic validation
    if (!formData.roundName || !formData.roundType) {
      setError("Round name and type are required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare the request data with proper field names and validation
      const requestData = {
        company_id: companyId,
        round_name: formData.roundName.trim(),
        round_type: formData.roundType,
        round_stage: formData.roundStage,
        total_investment: formData.totalInvestment ? Number(formData.totalInvestment) : 0,
        pre_money_valuation: formData.preMoneyValuation ? Number(formData.preMoneyValuation) : undefined,
        post_money_valuation: formData.postMoneyValuation ? Number(formData.postMoneyValuation) : undefined,
        price_per_share: formData.pricePerShare ? Number(formData.pricePerShare) : undefined,
        shares_issued: formData.sharesIssued ? parseInt(formData.sharesIssued, 10) : 0,
        closing_date: formData.closingDate ? formData.closingDate.toISOString().split('T')[0] : undefined,
        lead_investor: formData.leadInvestor?.trim() || undefined,
        liquidation_preference: formData.liquidationPreference ? Number(formData.liquidationPreference) : 1.0,
        participation_rights: formData.participationRights || 'non-participating',
        anti_dilution_rights: formData.antiDilutionRights || 'weighted_average_narrow',
        dividend_rate: formData.dividendRate ? Number(formData.dividendRate) : 0,
        voting_rights: formData.votingRights !== false,
        board_seats: formData.boardSeats ? parseInt(formData.boardSeats, 10) : 0,
        pro_rata_rights: formData.proRataRights !== false,
        drag_along_rights: formData.dragAlongRights !== false,
        tag_along_rights: formData.tagAlongRights !== false,
        is_completed: false,
        notes: formData.notes?.trim() || undefined,
        // SAFE-specific fields
        valuation_cap: formData.valuationCap ? Number(formData.valuationCap) : undefined,
        discount_rate: formData.discountRate ? Number(formData.discountRate) : undefined,
        most_favored_nation: formData.mostFavoredNation || false,
      }

      // Remove undefined values to avoid validation issues
      const cleanedData = Object.fromEntries(
        Object.entries(requestData).filter(([_, v]) => v !== undefined && v !== '')
      )

      console.log("Sending request data:", cleanedData)

      const response = await fetch("/api/funding-rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(cleanedData),
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error("API Error:", responseData)
        
        // Handle validation errors
        if (response.status === 400 && responseData.details) {
          const errorMessages = responseData.details.map((err: any) => 
            `${err.path?.join('.') || 'Field'}: ${err.message}`
          ).join('\n')
          throw new Error(`Validation failed:\n${errorMessages}`)
        }
        
        throw new Error(responseData.error || `Failed to create funding round (${response.status})`)
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating funding round:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const isSafeRound = formData.roundType === "safe"
  const isPricedRound = formData.roundType === "priced"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Funding Round</DialogTitle>
          <DialogDescription>Add a new funding round to track your company's investment history.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="round-name">Round Name *</Label>
                  <Input
                    id="round-name"
                    placeholder="e.g., Series A"
                    value={formData.roundName}
                    onChange={(e) => updateFormData("roundName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-stage">Round Stage *</Label>
                  <Select value={formData.roundStage} onValueChange={(value) => updateFormData("roundStage", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="series_b">Series B</SelectItem>
                      <SelectItem value="series_c">Series C</SelectItem>
                      <SelectItem value="series_d">Series D</SelectItem>
                      <SelectItem value="bridge">Bridge</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-type">Round Type *</Label>
                  <Select value={formData.roundType} onValueChange={(value) => updateFormData("roundType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">SAFE</SelectItem>
                      <SelectItem value="priced">Priced Round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isSafeRound && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  SAFE Terms
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Simple Agreement for Future Equity - Key terms that determine conversion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valuation-cap">Valuation Cap ($) *</Label>
                    <Input
                      id="valuation-cap"
                      type="number"
                      step="0.01"
                      placeholder="10000000"
                      value={formData.valuationCap}
                      onChange={(e) => updateFormData("valuationCap", e.target.value)}
                      required={isSafeRound}
                    />
                    <p className="text-xs text-muted-foreground">Maximum valuation for conversion</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-rate">Discount Rate (%)</Label>
                    <Input
                      id="discount-rate"
                      type="number"
                      step="0.1"
                      placeholder="20"
                      value={formData.discountRate}
                      onChange={(e) => updateFormData("discountRate", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Discount on future round price (typically 10-25%)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mfn"
                    checked={formData.mostFavoredNation}
                    onCheckedChange={(checked) => updateFormData("mostFavoredNation", checked)}
                  />
                  <Label htmlFor="mfn" className="text-sm">
                    Most Favored Nation (MFN) Clause
                  </Label>
                  <p className="text-xs text-muted-foreground ml-2">
                    Automatically get better terms if offered to future investors
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isPricedRound && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priced Round Terms</CardTitle>
                <CardDescription>Equity financing with defined share price and valuation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total-investment">Total Investment ($) *</Label>
                    <Input
                      id="total-investment"
                      type="number"
                      step="0.01"
                      placeholder="1000000"
                      value={formData.totalInvestment}
                      onChange={(e) => updateFormData("totalInvestment", e.target.value)}
                      required={isPricedRound}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pre-money-valuation">Pre-Money Valuation ($) *</Label>
                    <Input
                      id="pre-money-valuation"
                      type="number"
                      step="0.01"
                      placeholder="5000000"
                      value={formData.preMoneyValuation}
                      onChange={(e) => updateFormData("preMoneyValuation", e.target.value)}
                      required={isPricedRound}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="post-money-valuation">Post-Money Valuation ($)</Label>
                    <Input
                      id="post-money-valuation"
                      type="number"
                      step="0.01"
                      placeholder="6000000"
                      value={formData.postMoneyValuation}
                      onChange={(e) => updateFormData("postMoneyValuation", e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Auto-calculated: Pre-money + Investment</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-per-share">Price per Share ($)</Label>
                    <Input
                      id="price-per-share"
                      type="number"
                      step="0.0001"
                      placeholder="1.00"
                      value={formData.pricePerShare}
                      onChange={(e) => updateFormData("pricePerShare", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ESOP Management</CardTitle>
              <CardDescription>Employee Stock Option Pool adjustments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="esop-top-up"
                  checked={formData.esopTopUp}
                  onCheckedChange={(checked) => updateFormData("esopTopUp", checked)}
                />
                <Label htmlFor="esop-top-up">ESOP Pool Top-up</Label>
                <p className="text-xs text-muted-foreground ml-2">Increase option pool size</p>
              </div>

              {formData.esopTopUp && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="esop-percentage">New ESOP Pool Size (%)</Label>
                    <Input
                      id="esop-percentage"
                      type="number"
                      step="0.1"
                      placeholder="15"
                      value={formData.esopPercentage}
                      onChange={(e) => updateFormData("esopPercentage", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Percentage of fully diluted shares</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esop-shares">Additional ESOP Shares</Label>
                    <Input
                      id="esop-shares"
                      type="number"
                      placeholder="150000"
                      value={formData.esopShares}
                      onChange={(e) => updateFormData("esopShares", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Number of new option shares to create</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Founder Secondary</CardTitle>
              <CardDescription>Optional founder liquidity through secondary sales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="founder-secondary"
                  checked={formData.founderSecondary}
                  onCheckedChange={(checked) => updateFormData("founderSecondary", checked)}
                />
                <Label htmlFor="founder-secondary">Include Founder Secondary Sale</Label>
                <p className="text-xs text-muted-foreground ml-2">Founders selling existing shares</p>
              </div>

              {formData.founderSecondary && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="secondary-amount">Secondary Sale Amount ($)</Label>
                    <Input
                      id="secondary-amount"
                      type="number"
                      step="0.01"
                      placeholder="250000"
                      value={formData.secondaryAmount}
                      onChange={(e) => updateFormData("secondaryAmount", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Total amount of founder shares being sold</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Participating Founders</Label>
                    <Textarea
                      placeholder="List founders participating in secondary (comma-separated)"
                      value={formData.secondaryFounders.join(", ")}
                      onChange={(e) => updateFormData("secondaryFounders", e.target.value.split(", ").filter(Boolean))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Closing Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.closingDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.closingDate ? format(formData.closingDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.closingDate}
                        onSelect={(date) => updateFormData("closingDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-investor">Lead Investor</Label>
                  <Input
                    id="lead-investor"
                    placeholder="Investor name"
                    value={formData.leadInvestor}
                    onChange={(e) => updateFormData("leadInvestor", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this funding round"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Round"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
