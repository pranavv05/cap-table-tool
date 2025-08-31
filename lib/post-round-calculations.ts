export interface PostRoundOwnershipResult {
  founderOwnership: number
  investorOwnership: number
  esopOwnership: number
  stakeholders: Array<{
    id: string
    name: string
    type: string
    shares: number
    ownership: number
    dilution: number
  }>
}

export interface ShareholderInfo {
  id: string
  name: string
  shares: number
  type: string
}

export interface OwnershipResult {
  id: string
  name: string
  shares: number
  ownershipPercentage: number
  type: string
}

export interface DilutionResult {
  dilutionPercentage: number
  postRoundShares: number
  newSharesIssued: number
}

/**
 * Calculate ownership percentages for shareholders
 */
export function calculateOwnershipPercentages(
  shareholders: ShareholderInfo[],
  totalShares: number
): OwnershipResult[] {
  return shareholders.map(shareholder => ({
    id: shareholder.id,
    name: shareholder.name,
    shares: shareholder.shares,
    ownershipPercentage: (shareholder.shares / totalShares) * 100,
    type: shareholder.type
  }))
}

/**
 * Calculate dilution after a funding round
 */
export function calculateDilution(
  preRoundShares: number,
  newInvestment: number,
  sharePrice: number
): DilutionResult {
  const newSharesIssued = newInvestment / sharePrice
  const postRoundShares = preRoundShares + newSharesIssued
  const dilutionPercentage = (newSharesIssued / postRoundShares) * 100
  
  return {
    dilutionPercentage,
    postRoundShares,
    newSharesIssued
  }
}

import { enhancedMathEngine } from "./enhanced-math-engine"

export async function calculatePostRoundOwnership({
  fundingRounds,
  shareholders,
  equityGrants,
  throughRound = null,
}: {
  fundingRounds: any[]
  shareholders: any[]
  equityGrants: any[]
  throughRound?: string | null
}): Promise<PostRoundOwnershipResult> {
  // Filter rounds up to the specified round
  const relevantRounds = throughRound
    ? fundingRounds.filter((round, index) => {
        const targetIndex = fundingRounds.findIndex((r) => r.id === throughRound)
        return index <= targetIndex
      })
    : fundingRounds

  // Calculate total shares after all relevant rounds
  let totalShares = 10000000 // Initial shares

  relevantRounds.forEach((round) => {
    if (round.round_type === "SAFE") {
      const safeTerms = {
        amount: round.total_investment,
        valuationCap: round.valuation_cap,
        discountRate: round.discount_rate,
        hasMFN: round.has_mfn || false,
        conversionTrigger: "qualified_financing" as const,
        qualifiedFinancingThreshold: 1000000,
      }

      // Find next priced round for conversion
      const nextPricedRound = fundingRounds.find(
        (r) => r.round_type === "priced" && new Date(r.round_date) > new Date(round.round_date),
      )

      if (nextPricedRound) {
        const conversion = enhancedMathEngine.convertSAFE(safeTerms, nextPricedRound)
        totalShares += conversion.sharesIssued
      }
    } else {
      const pricePerShare = round.pre_money_valuation / totalShares
      const newShares = round.total_investment / pricePerShare

      // Check for anti-dilution adjustments
      if (round.is_down_round) {
        // Apply anti-dilution protection to existing preferred shares
        // This would require more complex logic to identify affected share classes
      }

      totalShares += newShares
    }

    if (round.esop_top_up_percentage) {
      const poolAdjustment = enhancedMathEngine.manageOptionPool({
        type: "refresh",
        percentage: round.esop_top_up_percentage,
        isPreMoney: round.esop_is_pre_money || false,
      })

      if (round.esop_is_pre_money) {
        totalShares = totalShares / (1 - round.esop_top_up_percentage / 100)
      } else {
        totalShares += poolAdjustment.totalShares
      }
    }
  })

  // Calculate ownership for each stakeholder
  const stakeholderResults = shareholders.map((shareholder) => {
    const shareholderGrants = equityGrants.filter((grant) => grant.shareholder_id === shareholder.id)
    const shareholderShares = shareholderGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    const ownership = (shareholderShares / totalShares) * 100

    // Calculate dilution (simplified - would need previous ownership data)
    const dilution = 0 // Placeholder for dilution calculation

    return {
      id: shareholder.id,
      name: shareholder.name,
      type: shareholder.shareholder_type,
      shares: shareholderShares,
      ownership,
      dilution,
    }
  })

  // Calculate aggregate ownership by type
  const founderOwnership = stakeholderResults
    .filter((s) => s.type === "founder")
    .reduce((sum, s) => sum + s.ownership, 0)

  const investorOwnership = stakeholderResults
    .filter((s) => s.type === "investor")
    .reduce((sum, s) => sum + s.ownership, 0)

  const esopOwnership = stakeholderResults
    .filter((s) => s.type === "esop" || s.type === "employee")
    .reduce((sum, s) => sum + s.ownership, 0)

  return {
    founderOwnership,
    investorOwnership,
    esopOwnership,
    stakeholders: stakeholderResults.sort((a, b) => b.ownership - a.ownership),
  }
}
