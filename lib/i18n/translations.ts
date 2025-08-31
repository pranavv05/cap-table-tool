/**
 * Internationalization (i18n) Configuration
 * 
 * Provides multi-language support for the cap table tool
 * Currently supports English (en) and Spanish (es) with extensible architecture
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh'

export interface TranslationKeys {
  // Common UI Elements
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    add: string
    remove: string
    next: string
    previous: string
    submit: string
    loading: string
    error: string
    success: string
    warning: string
    confirm: string
    close: string
  }
  
  // Navigation
  navigation: {
    dashboard: string
    capTable: string
    fundingRounds: string
    scenarios: string
    reports: string
    settings: string
  }
  
  // Cap Table
  capTable: {
    title: string
    ownership: string
    shareholders: string
    equityGrants: string
    totalShares: string
    currentValuation: string
    totalRaised: string
    founderOwnership: string
    esopPool: string
    exportData: string
  }
  
  // Funding Rounds
  fundingRounds: {
    title: string
    createRound: string
    roundName: string
    roundType: string
    investmentAmount: string
    preMoneyValuation: string
    postMoneyValuation: string
    pricePerShare: string
    leadInvestor: string
    closingDate: string
    safeTerms: string
    valuationCap: string
    discountRate: string
  }
  
  // Financial Terms
  financial: {
    shares: string
    percentage: string
    valuation: string
    dilution: string
    liquidationPreference: string
    antiDilution: string
    proRata: string
    participationRights: string
    dividendRate: string
    conversionRatio: string
  }
  
  // Onboarding
  onboarding: {
    welcome: string
    companySetup: string
    companyInfo: string
    founderSetup: string
    esopSetup: string
    reviewConfirm: string
    companyName: string
    incorporationDate: string
    jurisdiction: string
    authorizedShares: string
    founderName: string
    founderEmail: string
    founderTitle: string
    equityAllocation: string
    createEsopPool: string
    esopPoolSize: string
  }
  
  // Validation Messages
  validation: {
    required: string
    invalidEmail: string
    invalidNumber: string
    minimumValue: string
    maximumValue: string
    equityExceeds100: string
    duplicateName: string
  }
  
  // Success/Error Messages
  messages: {
    companySaved: string
    roundCreated: string
    dataExported: string
    calculationError: string
    networkError: string
    accessDenied: string
  }
  
  // Help & Tooltips
  help: {
    preMoneyExplanation: string
    postMoneyExplanation: string
    safeExplanation: string
    esopExplanation: string
    dilutionExplanation: string
    liquidationPreferenceExplanation: string
  }
}

// English translations (default)
export const en: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    confirm: 'Confirm',
    close: 'Close'
  },
  navigation: {
    dashboard: 'Dashboard',
    capTable: 'Cap Table',
    fundingRounds: 'Funding Rounds',
    scenarios: 'Scenarios',
    reports: 'Reports',
    settings: 'Settings'
  },
  capTable: {
    title: 'Cap Table',
    ownership: 'Ownership Distribution',
    shareholders: 'Shareholders',
    equityGrants: 'Equity Grants',
    totalShares: 'Total Shares',
    currentValuation: 'Current Valuation',
    totalRaised: 'Total Raised',
    founderOwnership: 'Founder Ownership',
    esopPool: 'ESOP Pool',
    exportData: 'Export Data'
  },
  fundingRounds: {
    title: 'Funding Rounds',
    createRound: 'Create Funding Round',
    roundName: 'Round Name',
    roundType: 'Round Type',
    investmentAmount: 'Investment Amount',
    preMoneyValuation: 'Pre-Money Valuation',
    postMoneyValuation: 'Post-Money Valuation',
    pricePerShare: 'Price per Share',
    leadInvestor: 'Lead Investor',
    closingDate: 'Closing Date',
    safeTerms: 'SAFE Terms',
    valuationCap: 'Valuation Cap',
    discountRate: 'Discount Rate'
  },
  financial: {
    shares: 'Shares',
    percentage: 'Percentage',
    valuation: 'Valuation',
    dilution: 'Dilution',
    liquidationPreference: 'Liquidation Preference',
    antiDilution: 'Anti-Dilution',
    proRata: 'Pro-Rata Rights',
    participationRights: 'Participation Rights',
    dividendRate: 'Dividend Rate',
    conversionRatio: 'Conversion Ratio'
  },
  onboarding: {
    welcome: 'Welcome to Cap Table Tool',
    companySetup: 'Company Setup',
    companyInfo: 'Company Information',
    founderSetup: 'Founder Setup',
    esopSetup: 'ESOP Setup',
    reviewConfirm: 'Review & Confirm',
    companyName: 'Company Name',
    incorporationDate: 'Incorporation Date',
    jurisdiction: 'Jurisdiction',
    authorizedShares: 'Authorized Shares',
    founderName: 'Founder Name',
    founderEmail: 'Founder Email',
    founderTitle: 'Founder Title',
    equityAllocation: 'Equity Allocation',
    createEsopPool: 'Create ESOP Pool',
    esopPoolSize: 'ESOP Pool Size'
  },
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidNumber: 'Please enter a valid number',
    minimumValue: 'Value must be at least {min}',
    maximumValue: 'Value cannot exceed {max}',
    equityExceeds100: 'Total equity allocation cannot exceed 100%',
    duplicateName: 'This name is already taken'
  },
  messages: {
    companySaved: 'Company information saved successfully',
    roundCreated: 'Funding round created successfully',
    dataExported: 'Data exported successfully',
    calculationError: 'Error calculating cap table data',
    networkError: 'Network error. Please try again.',
    accessDenied: 'Access denied. Please check your permissions.'
  },
  help: {
    preMoneyExplanation: 'Company valuation before new investment',
    postMoneyExplanation: 'Company valuation after new investment',
    safeExplanation: 'Simple Agreement for Future Equity - converts to shares in future rounds',
    esopExplanation: 'Employee Stock Option Pool - shares reserved for employee incentives',
    dilutionExplanation: 'Reduction in ownership percentage due to new share issuance',
    liquidationPreferenceExplanation: 'Priority in receiving proceeds during company sale or liquidation'
  }
}

// Spanish translations
export const es: TranslationKeys = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    remove: 'Remover',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    confirm: 'Confirmar',
    close: 'Cerrar'
  },
  navigation: {
    dashboard: 'Panel de Control',
    capTable: 'Tabla de Capitalización',
    fundingRounds: 'Rondas de Financiación',
    scenarios: 'Escenarios',
    reports: 'Reportes',
    settings: 'Configuración'
  },
  capTable: {
    title: 'Tabla de Capitalización',
    ownership: 'Distribución de Propiedad',
    shareholders: 'Accionistas',
    equityGrants: 'Concesiones de Capital',
    totalShares: 'Acciones Totales',
    currentValuation: 'Valoración Actual',
    totalRaised: 'Total Recaudado',
    founderOwnership: 'Propiedad del Fundador',
    esopPool: 'Grupo ESOP',
    exportData: 'Exportar Datos'
  },
  fundingRounds: {
    title: 'Rondas de Financiación',
    createRound: 'Crear Ronda de Financiación',
    roundName: 'Nombre de la Ronda',
    roundType: 'Tipo de Ronda',
    investmentAmount: 'Monto de Inversión',
    preMoneyValuation: 'Valoración Pre-Dinero',
    postMoneyValuation: 'Valoración Post-Dinero',
    pricePerShare: 'Precio por Acción',
    leadInvestor: 'Inversor Principal',
    closingDate: 'Fecha de Cierre',
    safeTerms: 'Términos SAFE',
    valuationCap: 'Límite de Valoración',
    discountRate: 'Tasa de Descuento'
  },
  financial: {
    shares: 'Acciones',
    percentage: 'Porcentaje',
    valuation: 'Valoración',
    dilution: 'Dilución',
    liquidationPreference: 'Preferencia de Liquidación',
    antiDilution: 'Anti-Dilución',
    proRata: 'Derechos Pro-Rata',
    participationRights: 'Derechos de Participación',
    dividendRate: 'Tasa de Dividendos',
    conversionRatio: 'Ratio de Conversión'
  },
  onboarding: {
    welcome: 'Bienvenido a la Herramienta de Tabla de Capitalización',
    companySetup: 'Configuración de la Empresa',
    companyInfo: 'Información de la Empresa',
    founderSetup: 'Configuración del Fundador',
    esopSetup: 'Configuración ESOP',
    reviewConfirm: 'Revisar y Confirmar',
    companyName: 'Nombre de la Empresa',
    incorporationDate: 'Fecha de Incorporación',
    jurisdiction: 'Jurisdicción',
    authorizedShares: 'Acciones Autorizadas',
    founderName: 'Nombre del Fundador',
    founderEmail: 'Email del Fundador',
    founderTitle: 'Título del Fundador',
    equityAllocation: 'Asignación de Capital',
    createEsopPool: 'Crear Grupo ESOP',
    esopPoolSize: 'Tamaño del Grupo ESOP'
  },
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Por favor ingrese un email válido',
    invalidNumber: 'Por favor ingrese un número válido',
    minimumValue: 'El valor debe ser al menos {min}',
    maximumValue: 'El valor no puede exceder {max}',
    equityExceeds100: 'La asignación total de capital no puede exceder el 100%',
    duplicateName: 'Este nombre ya está en uso'
  },
  messages: {
    companySaved: 'Información de la empresa guardada exitosamente',
    roundCreated: 'Ronda de financiación creada exitosamente',
    dataExported: 'Datos exportados exitosamente',
    calculationError: 'Error calculando los datos de la tabla de capitalización',
    networkError: 'Error de red. Por favor intente de nuevo.',
    accessDenied: 'Acceso denegado. Por favor verifique sus permisos.'
  },
  help: {
    preMoneyExplanation: 'Valoración de la empresa antes de la nueva inversión',
    postMoneyExplanation: 'Valoración de la empresa después de la nueva inversión',
    safeExplanation: 'Acuerdo Simple para Capital Futuro - se convierte en acciones en rondas futuras',
    esopExplanation: 'Grupo de Opciones de Acciones para Empleados - acciones reservadas para incentivos de empleados',
    dilutionExplanation: 'Reducción en el porcentaje de propiedad debido a la emisión de nuevas acciones',
    liquidationPreferenceExplanation: 'Prioridad en recibir ganancias durante la venta o liquidación de la empresa'
  }
}

// Translation registry
export const translations: Record<Locale, TranslationKeys> = {
  en,
  es,
  fr: en, // Fallback to English for now
  de: en, // Fallback to English for now
  pt: en, // Fallback to English for now
  zh: en  // Fallback to English for now
}

// Default locale
export const DEFAULT_LOCALE: Locale = 'en'

// Supported locales with their display names
export const SUPPORTED_LOCALES: Array<{ code: Locale; name: string; flag: string }> = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
]