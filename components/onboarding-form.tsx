"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, CheckCircle, Building2, FileText, Users, Target, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface OnboardingFormProps {
  userId: string
}

interface Founder {
  id: string
  name: string
  email: string
  equityValue: string
}

interface CompanyData {
  name: string
  description: string
  incorporationDate: Date | undefined
  jurisdiction: string
  companyType: string
  authorizedShares: string
  parValue: string
  numberOfFounders: number
  founders: Founder[]
  equityInputMethod: "percentage" | "shares"
  hasESOPAtIncorporation: boolean
  esopPoolPercentage: string
}

const steps = [
  {
    id: 1,
    title: "Company Information",
    description: "Basic details about your company",
    icon: Building2,
  },
  {
    id: 2,
    title: "Legal Structure",
    description: "Incorporation and legal details",
    icon: FileText,
  },
  {
    id: 3,
    title: "Founder Setup",
    description: "Founder details and equity allocation",
    icon: UserPlus,
  },
  {
    id: 4,
    title: "Share Structure",
    description: "Initial share configuration",
    icon: Users,
  },
  {
    id: 5,
    title: "Review & Complete",
    description: "Confirm your information",
    icon: Target,
  },
]

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getToken } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    description: "",
    incorporationDate: undefined,
    jurisdiction: "",
    companyType: "C-Corp",
    authorizedShares: "10000000",
    parValue: "0.001",
    numberOfFounders: 1,
    founders: [{ id: "1", name: "", email: "", equityValue: "" }],
    equityInputMethod: "percentage",
    hasESOPAtIncorporation: false,
    esopPoolPercentage: "20",
  })

  const updateFormData = (field: keyof CompanyData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFoundersCountChange = (count: number) => {
    const newFounders: Founder[] = []
    for (let i = 0; i < count; i++) {
      newFounders.push({
        id: (i + 1).toString(),
        name: formData.founders[i]?.name || "",
        email: formData.founders[i]?.email || "",
        equityValue: formData.founders[i]?.equityValue || "",
      })
    }
    setFormData((prev) => ({
      ...prev,
      numberOfFounders: count,
      founders: newFounders,
    }))
  }

  const updateFounderData = (founderId: string, field: keyof Founder, value: string) => {
    setFormData((prev) => ({
      ...prev,
      founders: prev.founders.map((founder) => (founder.id === founderId ? { ...founder, [field]: value } : founder)),
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Map form data to API schema format
      const apiData = {
        name: formData.name,
        description: formData.description || undefined,
        incorporation_date: formData.incorporationDate?.toISOString(),
        jurisdiction: formData.jurisdiction,
        company_type: formData.companyType,
        authorized_shares: Number.parseInt(formData.authorizedShares),
        par_value: Number.parseFloat(formData.parValue),
        clerk_user_id: userId // Ensure user ID is sent with the request
      }

      const token = await getToken()
      
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        
        if (errorData.code === 'RLS_ERROR') {
          throw new Error(`Database configuration issue: ${errorData.error}. ${errorData.instructions || ''}`)
        }
        
        throw new Error(errorData.error || "Failed to create company")
      }

      const result = await response.json()
      
      // Handle successful response
      if (result.needsUpdate) {
        // Show notification that user should update details
        toast({
          title: "Company Created Successfully!",
          description: "Your company was created. You can update details in company settings.",
          variant: "default"
        })
      } else {
        toast({
          title: "Company Created!",
          description: "Your company has been set up successfully.",
          variant: "default"
        })
      }
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating company:", error)
      
      toast({
        title: "Error Creating Company",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name.trim() !== ""
      case 2:
        return formData.incorporationDate && formData.jurisdiction.trim() !== ""
      case 3:
        return formData.founders.every(
          (founder) => founder.name.trim() !== "" && founder.email.trim() !== "" && founder.equityValue.trim() !== "",
        )
      case 4:
        return formData.authorizedShares.trim() !== "" && formData.parValue.trim() !== ""
      default:
        return true
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isActive
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 bg-white text-gray-400",
                )}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn("w-12 h-0.5 mx-2 transition-colors", isCompleted ? "bg-emerald-600" : "bg-gray-300")}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  placeholder="Enter your company name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Incorporation Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.incorporationDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.incorporationDate ? (
                        format(formData.incorporationDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.incorporationDate}
                      onSelect={(date) => updateFormData("incorporationDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                <Select value={formData.jurisdiction} onValueChange={(value) => updateFormData("jurisdiction", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delaware">Delaware</SelectItem>
                    <SelectItem value="california">California</SelectItem>
                    <SelectItem value="new-york">New York</SelectItem>
                    <SelectItem value="texas">Texas</SelectItem>
                    <SelectItem value="florida">Florida</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-type">Company Type</Label>
                <Select value={formData.companyType} onValueChange={(value) => updateFormData("companyType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C-Corp">C-Corporation</SelectItem>
                    <SelectItem value="S-Corp">S-Corporation</SelectItem>
                    <SelectItem value="LLC">Limited Liability Company</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Number of Founders */}
              <div className="space-y-3">
                <Label>Number of Founders *</Label>
                <Select
                  value={formData.numberOfFounders.toString()}
                  onValueChange={(value) => handleFoundersCountChange(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Founder{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Equity Input Method */}
              <div className="space-y-3">
                <Label>How would you like to input equity allocation? *</Label>
                <RadioGroup
                  value={formData.equityInputMethod}
                  onValueChange={(value: "percentage" | "shares") => updateFormData("equityInputMethod", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage (%)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shares" id="shares" />
                    <Label htmlFor="shares">Number of Shares</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Founder Details */}
              <div className="space-y-4">
                <Label>Founder Details *</Label>
                {formData.founders.map((founder, index) => (
                  <Card key={founder.id} className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Founder {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`founder-${founder.id}-name`}>Full Name *</Label>
                          <Input
                            id={`founder-${founder.id}-name`}
                            placeholder="Enter full name"
                            value={founder.name}
                            onChange={(e) => updateFounderData(founder.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`founder-${founder.id}-email`}>Email Address *</Label>
                          <Input
                            id={`founder-${founder.id}-email`}
                            type="email"
                            placeholder="Enter email address"
                            value={founder.email}
                            onChange={(e) => updateFounderData(founder.id, "email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`founder-${founder.id}-equity`}>
                            {formData.equityInputMethod === "percentage" ? "Equity %" : "Number of Shares"} *
                          </Label>
                          <Input
                            id={`founder-${founder.id}-equity`}
                            type="number"
                            placeholder={formData.equityInputMethod === "percentage" ? "50" : "5000000"}
                            value={founder.equityValue}
                            onChange={(e) => updateFounderData(founder.id, "equityValue", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* ESOP Pool */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="esop-pool"
                    checked={formData.hasESOPAtIncorporation}
                    onCheckedChange={(checked) => updateFormData("hasESOPAtIncorporation", checked)}
                  />
                  <Label htmlFor="esop-pool">Create ESOP (Employee Stock Option Pool) at incorporation</Label>
                </div>
                {formData.hasESOPAtIncorporation && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="esop-percentage">ESOP Pool Percentage</Label>
                    <Input
                      id="esop-percentage"
                      type="number"
                      placeholder="20"
                      value={formData.esopPoolPercentage}
                      onChange={(e) => updateFormData("esopPoolPercentage", e.target.value)}
                    />
                    <p className="text-sm text-gray-500">Typical ESOP pools range from 15-25% of total equity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authorized-shares">Authorized Shares *</Label>
                <Input
                  id="authorized-shares"
                  type="number"
                  placeholder="10000000"
                  value={formData.authorizedShares}
                  onChange={(e) => updateFormData("authorizedShares", e.target.value)}
                />
                <p className="text-sm text-gray-500">Total number of shares your company is authorized to issue</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="par-value">Par Value per Share *</Label>
                <Input
                  id="par-value"
                  type="number"
                  step="0.0001"
                  placeholder="0.001"
                  value={formData.parValue}
                  onChange={(e) => updateFormData("parValue", e.target.value)}
                />
                <p className="text-sm text-gray-500">Nominal value assigned to each share (typically $0.001)</p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">Company Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {formData.companyType}
                  </div>
                  <div>
                    <span className="font-medium">Jurisdiction:</span> {formData.jurisdiction}
                  </div>
                  <div>
                    <span className="font-medium">Incorporation:</span>{" "}
                    {formData.incorporationDate ? format(formData.incorporationDate, "PPP") : "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Authorized Shares:</span>{" "}
                    {Number.parseInt(formData.authorizedShares).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Par Value:</span> ${formData.parValue}
                  </div>
                </div>
                {formData.description && (
                  <div>
                    <span className="font-medium">Description:</span> {formData.description}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2">Founder Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Number of Founders:</span> {formData.numberOfFounders}
                    </div>
                    <div>
                      <span className="font-medium">Equity Input Method:</span>{" "}
                      {formData.equityInputMethod === "percentage" ? "Percentage" : "Shares"}
                    </div>
                    {formData.hasESOPAtIncorporation && (
                      <div>
                        <span className="font-medium">ESOP Pool:</span> {formData.esopPoolPercentage}%
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="font-medium">Founders:</span>
                    <div className="ml-4 mt-1 space-y-1">
                      {formData.founders.map((founder, index) => (
                        <div key={founder.id} className="text-sm">
                          {founder.name} ({founder.email}) - {founder.equityValue}
                          {formData.equityInputMethod === "percentage" ? "%" : " shares"}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext} disabled={!isStepValid(currentStep)}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating Company..." : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  )
}
