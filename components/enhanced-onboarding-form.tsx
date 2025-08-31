"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, HelpCircle, CheckCircle, Circle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Founder {
  id: string
  name: string
  email: string
  title: string
  equityType: "percentage" | "shares"
  equityValue: number
}

interface OnboardingData {
  companyName: string
  incorporationDate: string
  jurisdiction: string
  totalShares: number
  founders: Founder[]
  createESOPPool: boolean
  esopPoolSize: number
  esopPoolType: "percentage" | "shares"
}

export default function EnhancedOnboardingForm() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    companyName: "",
    incorporationDate: "",
    jurisdiction: "",
    totalShares: 10000000,
    founders: [{ id: "1", name: "", email: "", title: "CEO", equityType: "percentage", equityValue: 0 }],
    createESOPPool: false,
    esopPoolSize: 15,
    esopPoolType: "percentage",
  })
  const [equityInputMethod, setEquityInputMethod] = useState<"percentage" | "shares">("percentage")

  // Step configuration for progress tracking
  const steps = [
    {
      id: 1,
      title: "Company Info",
      description: "Basic company details",
      isComplete: !!(data.companyName && data.incorporationDate && data.jurisdiction)
    },
    {
      id: 2,
      title: "Founders",
      description: "Founder setup and equity",
      isComplete: data.founders.every(f => f.name && f.email && f.equityValue > 0)
    },
    {
      id: 3,
      title: "ESOP Setup",
      description: "Employee option pool",
      isComplete: !data.createESOPPool || (data.createESOPPool && data.esopPoolSize > 0)
    }
  ]

  const currentStepData = steps.find(s => s.id === step)
  const progressPercentage = ((step - 1) / (steps.length - 1)) * 100

  // Step Indicator Component
  const StepIndicator = () => (
    <div className="w-full mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={steps.length}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Setup Progress</h2>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          Step {step} of {steps.length}
        </span>
      </div>
      
      <Progress value={progressPercentage} className="mb-6" aria-label="Onboarding progress" />
      
      <div className="flex items-center justify-between">
        {steps.map((stepItem, index) => {
          const isActive = stepItem.id === step
          const isCompleted = stepItem.isComplete
          const isPast = stepItem.id < step
          
          return (
            <div key={stepItem.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    {
                      "bg-primary border-primary text-primary-foreground": isActive,
                      "bg-green-500 border-green-500 text-white": (isCompleted && !isActive) || isPast,
                      "border-muted-foreground text-muted-foreground": !isActive && !isCompleted && !isPast
                    }
                  )}
                  aria-label={`Step ${stepItem.id}: ${stepItem.title} - ${isCompleted ? 'completed' : isActive ? 'current' : 'upcoming'}`}
                >
                  {(isCompleted || isPast) ? (
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-medium">{stepItem.id}</span>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      {
                        "bg-green-500": isPast || (isActive && isCompleted),
                        "bg-primary": isActive && !isCompleted,
                        "bg-muted": !isPast && !isActive
                      }
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              
              <div className="mt-2 text-center">
                <div className={cn(
                  "text-sm font-medium",
                  {
                    "text-primary": isActive,
                    "text-green-600": isCompleted && !isActive,
                    "text-muted-foreground": !isActive && !isCompleted
                  }
                )}>
                  {stepItem.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stepItem.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const addFounder = () => {
    const newFounder: Founder = {
      id: Date.now().toString(),
      name: "",
      email: "",
      title: "",
      equityType: equityInputMethod,
      equityValue: 0,
    }
    setData((prev) => ({
      ...prev,
      founders: [...prev.founders, newFounder],
    }))
  }

  const removeFounder = (id: string) => {
    setData((prev) => ({
      ...prev,
      founders: prev.founders.filter((f) => f.id !== id),
    }))
  }

  const updateFounder = (id: string, field: keyof Founder, value: any) => {
    setData((prev) => ({
      ...prev,
      founders: prev.founders.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }))
  }

  const getTotalEquityAllocated = () => {
    return data.founders.reduce((total, founder) => {
      if (founder.equityType === "percentage") {
        return total + founder.equityValue
      } else {
        return total + (founder.equityValue / data.totalShares) * 100
      }
    }, 0)
  }

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Basic details about your company</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => setData((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="Enter your company name"
          />
        </div>
        <div>
          <Label htmlFor="incorporationDate">Incorporation Date</Label>
          <Input
            id="incorporationDate"
            type="date"
            value={data.incorporationDate}
            onChange={(e) => setData((prev) => ({ ...prev, incorporationDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="jurisdiction">Jurisdiction</Label>
          <Input
            id="jurisdiction"
            value={data.jurisdiction}
            onChange={(e) => setData((prev) => ({ ...prev, jurisdiction: e.target.value }))}
            placeholder="e.g., Delaware, California"
          />
        </div>
        <div>
          <Label htmlFor="totalShares">Total Authorized Shares</Label>
          <Input
            id="totalShares"
            type="number"
            value={data.totalShares}
            onChange={(e) => setData((prev) => ({ ...prev, totalShares: Number.parseInt(e.target.value) || 0 }))}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Founder Setup</CardTitle>
        <CardDescription>Add founder profiles and equity allocation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">How would you like to input equity allocation?</Label>
          <RadioGroup
            value={equityInputMethod}
            onValueChange={(value: "percentage" | "shares") => {
              setEquityInputMethod(value)
              // Update all founders to use the new method
              setData((prev) => ({
                ...prev,
                founders: prev.founders.map((f) => ({ ...f, equityType: value, equityValue: 0 })),
              }))
            }}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Percentage (%)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter ownership as percentages (e.g., 60%, 40%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shares" id="shares" />
              <Label htmlFor="shares">Number of Shares</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter exact number of shares to be allocated</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Founders ({data.founders.length})</Label>
            <Button onClick={addFounder} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Founder
            </Button>
          </div>

          {data.founders.map((founder, index) => (
            <Card key={founder.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`name-${founder.id}`}>Full Name</Label>
                  <Input
                    id={`name-${founder.id}`}
                    value={founder.name}
                    onChange={(e) => updateFounder(founder.id, "name", e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor={`email-${founder.id}`}>Email</Label>
                  <Input
                    id={`email-${founder.id}`}
                    type="email"
                    value={founder.email}
                    onChange={(e) => updateFounder(founder.id, "email", e.target.value)}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor={`title-${founder.id}`}>Title</Label>
                  <Input
                    id={`title-${founder.id}`}
                    value={founder.title}
                    onChange={(e) => updateFounder(founder.id, "title", e.target.value)}
                    placeholder="CEO, CTO, etc."
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`equity-${founder.id}`}>
                      Equity {equityInputMethod === "percentage" ? "(%)" : "(Shares)"}
                    </Label>
                    <Input
                      id={`equity-${founder.id}`}
                      type="number"
                      value={founder.equityValue}
                      onChange={(e) => updateFounder(founder.id, "equityValue", Number.parseFloat(e.target.value) || 0)}
                      placeholder={equityInputMethod === "percentage" ? "50" : "5000000"}
                      step={equityInputMethod === "percentage" ? "0.1" : "1"}
                    />
                  </div>
                  {data.founders.length > 1 && (
                    <Button
                      onClick={() => removeFounder(founder.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Equity Allocated:</span>
              <Badge variant={getTotalEquityAllocated() > 100 ? "destructive" : "default"}>
                {getTotalEquityAllocated().toFixed(1)}%
              </Badge>
            </div>
            {getTotalEquityAllocated() > 100 && (
              <p className="text-sm text-red-600 mt-2">Warning: Total equity allocation exceeds 100%</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>ESOP Pool Setup</CardTitle>
        <CardDescription>Configure your Employee Stock Option Pool</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="createESOPPool"
            checked={data.createESOPPool}
            onCheckedChange={(checked) => setData((prev) => ({ ...prev, createESOPPool: !!checked }))}
          />
          <Label htmlFor="createESOPPool" className="text-base font-medium">
            Create ESOP Pool at Incorporation
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recommended: 10-20% for early-stage startups</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {data.createESOPPool && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            <div>
              <Label className="text-base font-medium">ESOP Pool Input Method</Label>
              <RadioGroup
                value={data.esopPoolType}
                onValueChange={(value: "percentage" | "shares") =>
                  setData((prev) => ({ ...prev, esopPoolType: value }))
                }
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="esop-percentage" />
                  <Label htmlFor="esop-percentage">Percentage of total equity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shares" id="esop-shares" />
                  <Label htmlFor="esop-shares">Number of shares</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="esopPoolSize">
                ESOP Pool Size {data.esopPoolType === "percentage" ? "(%)" : "(Shares)"}
              </Label>
              <Input
                id="esopPoolSize"
                type="number"
                value={data.esopPoolSize}
                onChange={(e) => setData((prev) => ({ ...prev, esopPoolSize: Number.parseFloat(e.target.value) || 0 }))}
                placeholder={data.esopPoolType === "percentage" ? "15" : "1500000"}
                step={data.esopPoolType === "percentage" ? "0.1" : "1"}
              />
              <p className="text-sm text-muted-foreground mt-1">Typical range: 10-20% for early-stage startups</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">ESOP Pool Benefits:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Attract and retain top talent</li>
                <li>• Align employee interests with company success</li>
                <li>• Preserve founder equity for future rounds</li>
                <li>• Standard expectation from investors</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Confirm</CardTitle>
        <CardDescription>Review your company setup before proceeding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Company Details</h4>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p>
              <strong>Name:</strong> {data.companyName}
            </p>
            <p>
              <strong>Incorporation:</strong> {data.incorporationDate} ({data.jurisdiction})
            </p>
            <p>
              <strong>Authorized Shares:</strong> {data.totalShares.toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Founders ({data.founders.length})</h4>
          <div className="space-y-2">
            {data.founders.map((founder, index) => (
              <div key={founder.id} className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{founder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {founder.title} • {founder.email}
                    </p>
                  </div>
                  <Badge>
                    {founder.equityType === "percentage"
                      ? `${founder.equityValue}%`
                      : `${founder.equityValue.toLocaleString()} shares`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.createESOPPool && (
          <div>
            <h4 className="font-medium mb-2">ESOP Pool</h4>
            <div className="bg-muted p-4 rounded-lg">
              <p>
                <strong>Size:</strong>{" "}
                {data.esopPoolType === "percentage"
                  ? `${data.esopPoolSize}%`
                  : `${data.esopPoolSize.toLocaleString()} shares`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6 space-y-6" role="main" aria-labelledby="onboarding-title">
        <div className="text-center mb-8">
          <h1 id="onboarding-title" className="text-3xl font-bold">Company Setup</h1>
          <p className="text-muted-foreground mt-2">Let's set up your cap table step by step</p>
        </div>

        <StepIndicator />

        <div className="mt-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between pt-6" role="navigation" aria-label="Form navigation">
          <Button 
            onClick={() => setStep(step - 1)} 
            variant="outline" 
            disabled={step === 1}
            aria-label={`Go to previous step: ${steps[step - 2]?.title || ''}`}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (step === 4) {
                // Handle form submission
                console.log("[v0] Onboarding data:", data)
              } else {
                setStep(step + 1)
              }
            }}
            disabled={!currentStepData?.isComplete && step < 4}
            aria-label={step === 4 ? 'Complete company setup' : `Go to next step: ${steps[step]?.title || ''}`}
          >
            {step === 4 ? "Complete Setup" : "Next"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
