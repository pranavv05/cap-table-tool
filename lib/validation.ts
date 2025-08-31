import { z } from "zod"

// Common validation patterns
const positiveNumber = z.number().positive("Must be a positive number")
const nonNegativeNumber = z.number().min(0, "Must be non-negative")
const percentage = z.number().min(0).max(100, "Must be between 0 and 100")
const email = z.string().email("Invalid email format")
const uuid = z.string().uuid("Invalid UUID format")
const dateString = z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format")

// Company validation schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  description: z.string().max(500, "Description too long").optional(),
  incorporation_date: dateString,
  jurisdiction: z.string().min(1, "Jurisdiction is required").max(50, "Jurisdiction too long"),
  company_type: z.enum(["C-Corp", "S-Corp", "LLC", "Partnership", "Other"], {
    errorMap: () => ({ message: "Invalid company type" })
  }).default("C-Corp"),
  authorized_shares: positiveNumber.max(1e12, "Authorized shares too large"),
  par_value: nonNegativeNumber.max(1000, "Par value too large")
})

export const updateCompanySchema = createCompanySchema.partial()

// Shareholder validation schemas
export const createShareholderSchema = z.object({
  company_id: uuid,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: email.optional(),
  shareholder_type: z.enum(["founder", "employee", "investor", "advisor", "other"], {
    errorMap: () => ({ message: "Invalid shareholder type" })
  }),
  tax_id: z.string().max(50, "Tax ID too long").optional(),
  address: z.string().max(500, "Address too long").optional(),
  is_founder: z.boolean().default(false),
  is_employee: z.boolean().default(false),
  is_investor: z.boolean().default(false)
})

export const updateShareholderSchema = createShareholderSchema.partial().omit({ company_id: true })

// Equity grants validation schemas
export const createEquityGrantSchema = z.object({
  company_id: uuid,
  shareholder_id: uuid,
  grant_type: z.enum(["common", "preferred", "option", "warrant", "safe"], {
    errorMap: () => ({ message: "Invalid grant type" })
  }),
  shares_granted: positiveNumber.max(1e12, "Shares granted too large"),
  exercise_price: nonNegativeNumber.max(1e6, "Exercise price too large").optional(),
  grant_date: dateString,
  vesting_start_date: dateString.optional(),
  vesting_cliff_months: nonNegativeNumber.max(120, "Cliff too long").optional(),
  vesting_period_months: nonNegativeNumber.max(240, "Vesting period too long").optional(),
  is_active: z.boolean().default(true)
})

export const updateEquityGrantSchema = createEquityGrantSchema.partial().omit({ 
  company_id: true, 
  shareholder_id: true 
})

// Create base schema without refinements for partial operations
const baseFundingRoundSchema = z.object({
  company_id: uuid,
  round_name: z.string().min(1, "Round name is required").max(50, "Round name too long"),
  round_type: z.enum(["safe", "convertible", "priced", "bridge"], {
    errorMap: () => ({ message: "Invalid round type" })
  }),
  total_investment: positiveNumber.max(1e12, "Investment amount too large"),
  pre_money_valuation: positiveNumber.max(1e15, "Pre-money valuation too large").optional(),
  post_money_valuation: positiveNumber.max(1e15, "Post-money valuation too large").optional(),
  price_per_share: positiveNumber.max(1e6, "Price per share too large").optional(),
  shares_issued: positiveNumber.max(1e12, "Shares issued too large").optional(),
  closing_date: dateString.optional(),
  lead_investor: z.string().max(100, "Lead investor name too long").optional(),
  liquidation_preference: nonNegativeNumber.max(10, "Liquidation preference too high").default(1.0),
  participation_rights: z.enum(["non-participating", "participating", "capped-participation"], {
    errorMap: () => ({ message: "Invalid participation rights" })
  }).default("non-participating"),
  anti_dilution_rights: z.enum(["none", "weighted_average_narrow", "weighted_average_broad", "full_ratchet"], {
    errorMap: () => ({ message: "Invalid anti-dilution rights" })
  }).default("weighted_average_narrow"),
  dividend_rate: percentage.default(0),
  voting_rights: z.boolean().default(true),
  board_seats: nonNegativeNumber.max(20, "Too many board seats").default(0),
  pro_rata_rights: z.boolean().default(true),
  drag_along_rights: z.boolean().default(true),
  tag_along_rights: z.boolean().default(true),
  is_completed: z.boolean().default(false),
  notes: z.string().max(1000, "Notes too long").optional()
})

// Funding round validation schemas with refinements
export const createFundingRoundSchema = baseFundingRoundSchema.refine((data) => {
  // Business logic validation: ensure valuation consistency
  if (data.pre_money_valuation && data.post_money_valuation && data.total_investment) {
    const expectedPostMoney = data.pre_money_valuation + data.total_investment
    const tolerance = 0.01 // 1% tolerance
    return Math.abs(data.post_money_valuation - expectedPostMoney) / expectedPostMoney <= tolerance
  }
  return true
}, {
  message: "Post-money valuation must equal pre-money valuation plus investment amount",
  path: ["post_money_valuation"]
}).refine((data) => {
  // Ensure at least one valuation method is provided for priced rounds
  if (data.round_type === "priced") {
    return data.pre_money_valuation || data.post_money_valuation || data.price_per_share
  }
  return true
}, {
  message: "Priced rounds must have pre-money valuation, post-money valuation, or price per share",
  path: ["pre_money_valuation"]
})

export const updateFundingRoundSchema = baseFundingRoundSchema.partial().omit({ company_id: true })

// SAFE-specific validation
export const safeTermsSchema = z.object({
  valuation_cap: positiveNumber.max(1e15, "Valuation cap too large").optional(),
  discount_rate: percentage.optional(),
  most_favored_nation: z.boolean().default(false),
  conversion_trigger: z.enum(["qualified_financing", "liquidity_event", "maturity"], {
    errorMap: () => ({ message: "Invalid conversion trigger" })
  }).default("qualified_financing"),
  qualified_financing_threshold: positiveNumber.max(1e12, "Threshold too large").default(1000000),
  maturity_date: dateString.optional()
}).refine((data) => {
  // SAFE must have either valuation cap or discount rate
  return data.valuation_cap || data.discount_rate
}, {
  message: "SAFE must have either valuation cap or discount rate",
  path: ["valuation_cap"]
})

// Create base scenario schema without refinements for partial operations
const baseScenarioSchema = z.object({
  company_id: uuid,
  name: z.string().min(1, "Scenario name is required").max(100, "Scenario name too long"),
  scenario_type: z.enum(["funding", "exit", "dilution", "option_pool"], {
    errorMap: () => ({ message: "Invalid scenario type" })
  }),
  description: z.string().max(1000, "Description too long").optional(),
  exit_valuation: positiveNumber.max(1e15, "Exit valuation too large").optional(),
  liquidation_preference_multiple: nonNegativeNumber.max(10, "Liquidation preference too high").optional(),
  participation_cap: positiveNumber.max(1e15, "Participation cap too large").optional(),
  new_investment_amount: positiveNumber.max(1e12, "Investment amount too large").optional(),
  new_pre_money_valuation: positiveNumber.max(1e15, "Pre-money valuation too large").optional(),
  new_option_pool_percentage: percentage.optional(),
  is_baseline: z.boolean().default(false),
  assumptions: z.record(z.any()).optional(),
  results: z.record(z.any()).optional()
})

// Scenario validation schemas with refinements
export const createScenarioSchema = baseScenarioSchema.refine((data) => {
  // Ensure required fields based on scenario type
  if (data.scenario_type === "exit" && !data.exit_valuation) {
    return false
  }
  if (data.scenario_type === "funding" && !data.new_investment_amount) {
    return false
  }
  return true
}, {
  message: "Required fields missing for scenario type",
  path: ["scenario_type"]
})

export const updateScenarioSchema = baseScenarioSchema.partial().omit({ company_id: true })

// PRD generation validation schemas
export const generatePRDSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters").max(5000, "Prompt too long"),
  prd_type: z.enum(["feature", "product", "technical", "business"], {
    errorMap: () => ({ message: "Invalid PRD type" })
  }),
  company_data: z.object({
    name: z.string().min(1, "Company name required"),
    description: z.string().optional(),
    industry: z.string().optional()
  }).optional(),
  cap_table_data: z.object({
    total_shares: positiveNumber.optional(),
    valuation: positiveNumber.optional(),
    funding_rounds: z.array(z.any()).optional()
  }).optional(),
  action: z.enum(["generate", "iterate"]).default("generate")
})

export const iteratePRDSchema = z.object({
  existing_prd: z.object({
    id: z.string().min(1, "PRD ID required"),
    title: z.string().min(1, "PRD title required"),
    description: z.string().optional(),
    content: z.string().min(1, "PRD content required"),
    version: z.number().int().min(1, "Version must be at least 1"),
    created_at: dateString
  }),
  iteration_feedback: z.string().min(10, "Feedback must be at least 10 characters").max(2000, "Feedback too long"),
  action: z.literal("iterate")
}).merge(generatePRDSchema.omit({ action: true }))

// API request validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit too large").default(10),
  sort_by: z.string().max(50, "Sort field too long").optional(),
  sort_order: z.enum(["asc", "desc"]).default("desc")
})

export const companyQuerySchema = z.object({
  clerk_user_id: z.string().min(1, "User ID is required")
}).merge(paginationSchema.partial())

// Complex validation for cap table calculations
export const capTableCalculationSchema = z.object({
  company_id: uuid,
  as_of_date: dateString.optional(),
  include_options: z.boolean().default(true),
  include_warrants: z.boolean().default(true),
  fully_diluted: z.boolean().default(false)
})

// Bulk operations validation
export const bulkCreateShareholdersSchema = z.object({
  company_id: uuid,
  shareholders: z.array(createShareholderSchema.omit({ company_id: true }))
    .min(1, "At least one shareholder required")
    .max(100, "Too many shareholders in bulk operation")
})

// File upload validation
export const fileUploadSchema = z.object({
  file_type: z.enum(["csv", "xlsx", "pdf"], {
    errorMap: () => ({ message: "Invalid file type" })
  }),
  file_size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
  file_name: z.string().min(1, "File name required").max(255, "File name too long")
})

// Custom validation helpers
export function validateMonetaryAmount(amount: number, fieldName: string) {
  if (!Number.isFinite(amount)) {
    throw new Error(`${fieldName} must be a valid number`)
  }
  if (amount < 0) {
    throw new Error(`${fieldName} cannot be negative`)
  }
  if (amount > 1e15) {
    throw new Error(`${fieldName} is too large`)
  }
  return true
}

export function validateOwnershipPercentage(percentage: number) {
  if (!Number.isFinite(percentage)) {
    throw new Error("Ownership percentage must be a valid number")
  }
  if (percentage < 0 || percentage > 100) {
    throw new Error("Ownership percentage must be between 0 and 100")
  }
  return true
}

export function validateDate(dateString: string, fieldName: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`)
  }
  
  const now = new Date()
  const minDate = new Date('1900-01-01')
  const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year in future
  
  if (date < minDate || date > maxDate) {
    throw new Error(`${fieldName} must be between 1900 and one year from now`)
  }
  
  return true
}

// Error formatting helper
export function formatZodError(error: z.ZodError) {
  return {
    message: "Validation failed",
    errors: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
  }
}

// Validation middleware type
export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: {
    message: string
    errors: Array<{
      field: string
      message: string
      code: string
    }>
  }
}

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) }
    }
    return {
      success: false,
      error: {
        message: "Validation failed",
        errors: [{ field: "unknown", message: "Unknown validation error", code: "unknown" }]
      }
    }
  }
}