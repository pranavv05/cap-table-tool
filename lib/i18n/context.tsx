"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, TranslationKeys, translations, DEFAULT_LOCALE } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

/**
 * i18n Provider Component
 * 
 * Provides internationalization context to the entire application
 * Handles locale switching and translation loading
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isLoading, setIsLoading] = useState(false)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('cap-table-locale') as Locale
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setIsLoading(true)
    
    // Simulate loading time for better UX
    setTimeout(() => {
      setLocaleState(newLocale)
      localStorage.setItem('cap-table-locale', newLocale)
      
      // Update document language
      document.documentElement.lang = newLocale
      
      setIsLoading(false)
    }, 200)
  }

  /**
   * Translation function with interpolation support
   * 
   * @param key - Translation key in dot notation (e.g., 'common.save')
   * @param params - Parameters for string interpolation
   * @returns Translated string
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const currentTranslations = translations[locale] || translations[DEFAULT_LOCALE]
    
    // Navigate through nested object using dot notation
    const keys = key.split('.')
    let value: any = currentTranslations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key // Return key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }
    
    // Handle parameter interpolation
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`{${param}}`, 'g'), String(val)),
        value
      )
    }
    
    return value
  }

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    isLoading
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Hook to use i18n functionality
 * 
 * @returns i18n context with locale, setLocale, and t function
 */
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

/**
 * Hook for translations only (lighter weight)
 * 
 * @returns Translation function
 */
export function useTranslation() {
  const { t } = useI18n()
  return { t }
}

/**
 * Higher-order component to provide translations to class components
 */
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: (key: string, params?: Record<string, string | number>) => string }>
) {
  return function WrappedComponent(props: P) {
    const { t } = useTranslation()
    return <Component {...props} t={t} />
  }
}

/**
 * Utility function to get browser locale
 * 
 * @returns Detected locale or default locale
 */
export function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  
  const browserLang = navigator.language.split('-')[0] as Locale
  return translations[browserLang] ? browserLang : DEFAULT_LOCALE
}

/**
 * Format number according to locale
 * 
 * @param value - Number to format
 * @param locale - Locale for formatting
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value)
  } catch {
    return value.toString()
  }
}

/**
 * Format currency according to locale
 * 
 * @param value - Amount to format
 * @param locale - Locale for formatting
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string = 'USD'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value)
  } catch {
    return `$${value.toLocaleString()}`
  }
}

/**
 * Format date according to locale
 * 
 * @param date - Date to format
 * @param locale - Locale for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

/**
 * Format percentage according to locale
 * 
 * @param value - Decimal value (0.25 for 25%)
 * @param locale - Locale for formatting
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: Locale,
  decimals: number = 1
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100)
  } catch {
    return `${value.toFixed(decimals)}%`
  }
}

export type { I18nContextType }