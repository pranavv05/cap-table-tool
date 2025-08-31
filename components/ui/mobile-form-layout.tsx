"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface MobileFormLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  currentStep?: number
  totalSteps?: number
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
  backDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  sidePanel?: React.ReactNode
  className?: string
}

export function MobileFormLayout({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextDisabled = false,
  backDisabled = false,
  nextLabel = "Next",
  backLabel = "Back",
  sidePanel,
  className
}: MobileFormLayoutProps) {
  const [sidePanelOpen, setSidePanelOpen] = React.useState(false)

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                disabled={backDisabled}
                className="p-2"
                aria-label={backLabel}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep && totalSteps && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentStep}/{totalSteps}
              </span>
            )}
            {sidePanel && (
              <Sheet open={sidePanelOpen} onOpenChange={setSidePanelOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open side panel</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <div className="mt-6">
                    {sidePanel}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block border-b border-border bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            {currentStep && totalSteps && (
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>

        {/* Desktop Side Panel */}
        {sidePanel && (
          <aside className="hidden lg:block w-80 border-l border-border bg-muted/30 overflow-y-auto">
            <div className="p-6">
              {sidePanel}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Footer Actions */}
      {(onBack || onNext) && (
        <div className="sticky bottom-0 z-50 bg-background border-t border-border lg:hidden">
          <div className="flex items-center justify-between p-4 space-x-4">
            {onBack ? (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={backDisabled}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            ) : (
              <div />
            )}
            
            {onNext && (
              <Button
                onClick={onNext}
                disabled={nextDisabled}
                className="flex-1"
              >
                {nextLabel}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile-optimized form field component
interface MobileFormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  description?: string
  className?: string
}

export function MobileFormField({
  label,
  children,
  error,
  required,
  description,
  className
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="space-y-1">
        {children}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// Mobile-optimized form section component
interface MobileFormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

export function MobileFormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  className
}: MobileFormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "flex items-center justify-between",
          collapsible && "cursor-pointer"
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {collapsible && (
          <Button variant="ghost" size="sm" className="p-1">
            {isOpen ? (
              <ChevronLeft className="h-4 w-4 rotate-90" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {isOpen && (
        <div className="space-y-4 pl-0 lg:pl-4">
          {children}
        </div>
      )}
    </div>
  )
}