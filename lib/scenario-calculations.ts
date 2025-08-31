// Utility functions for calculating scenario outcomes

import { enhancedMathEngine } from "./enhanced-math-engine"

export interface ShareholderOutcome {
  shareholderId: string
  shareholderName: string
  shareholderType: string
  currentOwnership: number
  newOwnership: number
  payout: number
  returnMultiple: number
}

export interface ScenarioOutcomes {
  totalProceeds: number
  commonProceeds: number
  preferredProceeds: number
  dilutionPercentage: number
  shareholderOutcomes: ShareholderOutcome[]
}

export function calculateScenarioOutcomes(
  scenario: any,
  shareholders: any[],
  equityGrants: any[],
  fundingRounds: any[],
): ScenarioOutcomes {
  const validation = enhancedMathEngine.validateScenario(scenario)
  if (!validation.isValid) {
    throw new Error(`Scenario validation failed: ${validation.errors.join(", ")}`)
  }

  // Calculate current ownership percentages
  const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

  const shareholderOutcomes: ShareholderOutcome[] = shareholders.map((shareholder) => {
    const shareholderGrants = equityGrants.filter((grant) => grant.shareholder_id === shareholder.id)
    const shareholderShares = shareholderGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)
    const currentOwnership = totalShares > 0 ? (shareholderShares / totalShares) * 100 : 0

    let payout = 0
    let newOwnership = currentOwnership
    let returnMultiple = 0

    if (scenario.scenario_type === "exit") {
      // Calculate exit payout based on liquidation preferences and participation rights
      payout = calculateExitPayout(
        shareholderShares,
        totalShares,
        scenario.exit_valuation,
        shareholderGrants,
        fundingRounds,
      )

      // Calculate return multiple (simplified - would need investment amounts)
      returnMultiple = payout > 0 ? payout / 100000 : 0 // Placeholder calculation
    } else if (scenario.scenario_type === "funding_round") {
      // Calculate dilution from new funding round
      const newShares = scenario.new_investment_amount / (scenario.new_pre_money_valuation / totalShares)
      const newTotalShares = totalShares + newShares
      newOwnership = (shareholderShares / newTotalShares) * 100
      payout = 0 // No immediate payout for funding rounds
    }

    return {
      shareholderId: shareholder.id,
      shareholderName: shareholder.name,
      shareholderType: shareholder.shareholder_type,
      currentOwnership,
      newOwnership,
      payout,
      returnMultiple,
    }
  })

  // Calculate total proceeds and dilution
  let totalProceeds = 0
  let commonProceeds = 0
  let preferredProceeds = 0
  let dilutionPercentage = 0

  if (scenario.scenario_type === "exit") {
    totalProceeds = scenario.exit_valuation

    const waterfall = enhancedMathEngine.calculateLiquidationWaterfall(scenario.exit_valuation)

    // Update shareholder outcomes based on enhanced waterfall
    shareholderOutcomes.forEach((outcome) => {
      const distributions = waterfall.distributions.filter((d) => d.shareholderId === outcome.shareholderId)
      outcome.payout = distributions.reduce((sum, d) => sum + d.amount, 0)

      // Calculate more accurate return multiple
      const totalInvestment = equityGrants
        .filter((grant) => grant.shareholder_id === outcome.shareholderId)
        .reduce((sum, grant) => sum + grant.shares_granted * (grant.strike_price || 0), 0)

      outcome.returnMultiple = totalInvestment > 0 ? outcome.payout / totalInvestment : 0
    })

    preferredProceeds = waterfall.distributions
      .filter((d) => d.source === "liquidation_preference" || d.source === "participation")
      .reduce((sum, d) => sum + d.amount, 0)

    commonProceeds = waterfall.distributions.filter((d) => d.source === "common").reduce((sum, d) => sum + d.amount, 0)
  } else if (scenario.scenario_type === "funding_round") {
    const newShares = scenario.new_investment_amount / (scenario.new_pre_money_valuation / totalShares)
    dilutionPercentage = (newShares / (totalShares + newShares)) * 100
  }

  return {
    totalProceeds,
    commonProceeds,
    preferredProceeds,
    dilutionPercentage,
    shareholderOutcomes: shareholderOutcomes.sort((a, b) => b.payout - a.payout),
  }
}

function calculateExitPayout(
  shareholderShares: number,
  totalShares: number,
  exitValuation: number,
  shareholderGrants: any[],
  fundingRounds: any[],
): number {
  // Simplified liquidation waterfall calculation
  // In a real implementation, this would be much more complex

  const ownershipPercentage = totalShares > 0 ? shareholderShares / totalShares : 0

  // Check if shareholder has preferred shares with liquidation preferences
  const preferredGrants = shareholderGrants.filter((grant) => grant.grant_type.includes("preferred"))

  if (preferredGrants.length > 0) {
    // Calculate preferred liquidation preference
    let preferredPayout = 0
    preferredGrants.forEach((grant) => {
      const liquidationPref = grant.liquidation_preference || 1.0
      const investmentAmount = grant.shares_granted * (grant.strike_price || 1.0)
      preferredPayout += investmentAmount * liquidationPref
    })

    // Check if participating preferred - if so, also gets pro-rata share of remaining
    const participatingPayout = ownershipPercentage * Math.max(0, exitValuation - preferredPayout)

    return preferredPayout + participatingPayout
  } else {
    // Common stock - gets pro-rata share after preferred liquidation preferences
    const totalPreferredPayout = fundingRounds.reduce((sum, round) => {
      return sum + round.total_investment * (round.liquidation_preference || 1.0)
    }, 0)

    const remainingForCommon = Math.max(0, exitValuation - totalPreferredPayout)
    return ownershipPercentage * remainingForCommon
  }
}
