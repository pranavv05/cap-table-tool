"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateScenarioDialogProps {
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ScenarioData {
  name: string
  scenarioType: string
  description: string
  exitValuation: string
  liquidationPreferenceMultiple: string
  participationCap: string
  newInvestmentAmount: string
  newPreMoneyValuation: string
  newOptionPoolPercentage: string
  isBaseline: boolean
}

export function CreateScenarioDialog({ companyId, open, onOpenChange }: CreateScenarioDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ScenarioData>({
    name: "",
    scenarioType: "exit",
    description: "",
    exitValuation: "",
    liquidationPreferenceMultiple: "1.0",
    participationCap: "",
    newInvestmentAmount: "",
    newPreMoneyValuation: "",
    newOptionPoolPercentage: "",
    isBaseline: false,
  })

  const updateFormData = (field: keyof ScenarioData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          companyId,
          exitValuation: formData.exitValuation ? Number.parseFloat(formData.exitValuation) : null,
          liquidationPreferenceMultiple: Number.parseFloat(formData.liquidationPreferenceMultiple) || 1.0,
          participationCap: formData.participationCap ? Number.parseFloat(formData.participationCap) : null,
          newInvestmentAmount: formData.newInvestmentAmount ? Number.parseFloat(formData.newInvestmentAmount) : null,
          newPreMoneyValuation: formData.newPreMoneyValuation ? Number.parseFloat(formData.newPreMoneyValuation) : null,
          newOptionPoolPercentage: formData.newOptionPoolPercentage
            ? Number.parseFloat(formData.newOptionPoolPercentage) / 100
            : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create scenario")
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating scenario:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Scenario</DialogTitle>
          <DialogDescription>Model different outcomes for your company's future.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name *</Label>
                <Input
                  id="scenario-name"
                  placeholder="e.g., IPO at $1B"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario-type">Scenario Type *</Label>
                <Select value={formData.scenarioType} onValueChange={(value) => updateFormData("scenarioType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exit">Exit (IPO/Acquisition)</SelectItem>
                    <SelectItem value="funding_round">Future Funding Round</SelectItem>
                    <SelectItem value="option_pool_expansion">Option Pool Expansion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this scenario"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
              />
            </div>
          </div>

          {/* Scenario-specific fields */}
          {formData.scenarioType === "exit" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Exit Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exit-valuation">Exit Valuation ($) *</Label>
                  <Input
                    id="exit-valuation"
                    type="number"
                    step="0.01"
                    placeholder="100000000"
                    value={formData.exitValuation}
                    onChange={(e) => updateFormData("exitValuation", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="liquidation-preference">Liquidation Preference Multiple</Label>
                  <Input
                    id="liquidation-preference"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={formData.liquidationPreferenceMultiple}
                    onChange={(e) => updateFormData("liquidationPreferenceMultiple", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participation-cap">Participation Cap (Multiple)</Label>
                  <Input
                    id="participation-cap"
                    type="number"
                    step="0.1"
                    placeholder="3.0"
                    value={formData.participationCap}
                    onChange={(e) => updateFormData("participationCap", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {formData.scenarioType === "funding_round" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Funding Round Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investment-amount">Investment Amount ($) *</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    step="0.01"
                    placeholder="5000000"
                    value={formData.newInvestmentAmount}
                    onChange={(e) => updateFormData("newInvestmentAmount", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pre-money-valuation">Pre-Money Valuation ($) *</Label>
                  <Input
                    id="pre-money-valuation"
                    type="number"
                    step="0.01"
                    placeholder="20000000"
                    value={formData.newPreMoneyValuation}
                    onChange={(e) => updateFormData("newPreMoneyValuation", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {formData.scenarioType === "option_pool_expansion" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Option Pool Details</h3>
              <div className="space-y-2">
                <Label htmlFor="option-pool-percentage">New Option Pool Size (%) *</Label>
                <Input
                  id="option-pool-percentage"
                  type="number"
                  step="0.1"
                  placeholder="15"
                  value={formData.newOptionPoolPercentage}
                  onChange={(e) => updateFormData("newOptionPoolPercentage", e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">Percentage of fully diluted shares to allocate to option pool</p>
              </div>
            </div>
          )}

          {/* Baseline checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-baseline"
              checked={formData.isBaseline}
              onCheckedChange={(checked) => updateFormData("isBaseline", checked)}
            />
            <Label htmlFor="is-baseline" className="text-sm">
              Set as baseline scenario for comparisons
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Scenario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
