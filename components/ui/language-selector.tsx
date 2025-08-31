"use client"

import React from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface LanguageSelectorProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showFlag?: boolean
  showText?: boolean
  className?: string
}

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
]

export function LanguageSelector({
  variant = "outline",
  size = "sm",
  showFlag = true,
  showText = true,
  className
}: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n()
  const [isLoading, setIsLoading] = React.useState(false)

  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale)

  const handleLocaleChange = async (newLocale: string) => {
    if (newLocale === locale) return
    
    setIsLoading(true)
    try {
      await setLocale(newLocale as 'en' | 'es')
    } catch (error) {
      console.error('Failed to change locale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "relative",
            isLoading && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={isLoading}
          aria-label="Select language"
        >
          <div className="flex items-center gap-2">
            {showFlag && currentLocale && (
              <span className="text-sm" role="img" aria-label={currentLocale.name}>
                {currentLocale.flag}
              </span>
            )}
            {showText && (
              <span className="hidden sm:inline">
                {currentLocale?.name || 'Language'}
              </span>
            )}
            {!showFlag && !showText && (
              <Globe className="h-4 w-4" />
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <DropdownMenuItem
            key={supportedLocale.code}
            onClick={() => handleLocaleChange(supportedLocale.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              locale === supportedLocale.code && "bg-muted"
            )}
            role="menuitem"
          >
            <span 
              className="text-base" 
              role="img" 
              aria-label={`${supportedLocale.name} flag`}
            >
              {supportedLocale.flag}
            </span>
            <span className="flex-1">{supportedLocale.name}</span>
            {locale === supportedLocale.code && (
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact variant for mobile or space-constrained areas
export function CompactLanguageSelector({ className }: { className?: string }) {
  return (
    <LanguageSelector
      variant="ghost"
      size="sm"
      showFlag={true}
      showText={false}
      className={className}
    />
  )
}

// Full variant for main navigation
export function FullLanguageSelector({ className }: { className?: string }) {
  return (
    <LanguageSelector
      variant="outline"
      size="default"
      showFlag={true}
      showText={true}
      className={className}
    />
  )
}