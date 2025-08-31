// High-performance calculation engine with memoization and caching
// Designed to meet sub-1 second performance requirements for up to 10 funding rounds

interface CalculationCache {
  totalShares?: number
  shareholderMaps?: Map<string, any[]>
  liquidationPreferences?: Map<string, number>
  lastUpdated?: number
}

interface PerformanceMetrics {
  calculationTime: number
  cacheHits: number
  cacheMisses: number
}

export class OptimizedCapTableCalculator {
  private cache: CalculationCache = {}
  private readonly CACHE_TTL = 5000 // 5 seconds cache TTL
  private performanceMetrics: PerformanceMetrics = {
    calculationTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  }

  private isCacheValid(): boolean {
    return this.cache.lastUpdated && Date.now() - this.cache.lastUpdated < this.CACHE_TTL
  }

  private invalidateCache(): void {
    this.cache = {}
  }

  private getTotalShares(equityGrants: any[]): number {
    if (this.isCacheValid() && this.cache.totalShares !== undefined) {
      this.performanceMetrics.cacheHits++
      return this.cache.totalShares
    }

    this.performanceMetrics.cacheMisses++
    const totalShares = equityGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

    this.cache.totalShares = totalShares
    this.cache.lastUpdated = Date.now()

    return totalShares
  }

  private getShareholderMaps(shareholders: any[], equityGrants: any[]): Map<string, any[]> {
    if (this.isCacheValid() && this.cache.shareholderMaps) {
      this.performanceMetrics.cacheHits++
      return this.cache.shareholderMaps
    }

    this.performanceMetrics.cacheMisses++
    const shareholderMaps = new Map<string, any[]>()

    // Group equity grants by shareholder for efficient lookup
    equityGrants.forEach((grant) => {
      const shareholderId = grant.shareholder_id
      if (!shareholderMaps.has(shareholderId)) {
        shareholderMaps.set(shareholderId, [])
      }
      shareholderMaps.get(shareholderId)!.push(grant)
    })

    this.cache.shareholderMaps = shareholderMaps
    return shareholderMaps
  }

  private calculateLiquidationWaterfall(
    exitValuation: number,
    fundingRounds: any[],
    equityGrants: any[],
  ): { preferredProceeds: number; commonProceeds: number; waterfallSteps: any[] } {
    const waterfallSteps: any[] = []
    let remainingProceeds = exitValuation

    // Sort funding rounds by seniority (later rounds have higher preference)
    const sortedRounds = [...fundingRounds].sort(
      (a, b) => new Date(b.round_date).getTime() - new Date(a.round_date).getTime(),
    )

    let totalPreferredProceeds = 0

    // Process each liquidation preference tier
    for (const round of sortedRounds) {
      const liquidationPref = round.liquidation_preference || 1.0
      const preferenceAmount = round.total_investment * liquidationPref
      const actualPayout = Math.min(preferenceAmount, remainingProceeds)

      waterfallSteps.push({
        roundName: round.round_name,
        preferenceAmount,
        actualPayout,
        isParticipating: round.is_participating || false,
      })

      totalPreferredProceeds += actualPayout
      remainingProceeds -= actualPayout

      if (remainingProceeds <= 0) break
    }

    // Handle participating preferred shares
    const participatingRounds = sortedRounds.filter((r) => r.is_participating)
    if (participatingRounds.length > 0 && remainingProceeds > 0) {
      // Calculate pro-rata participation
      const totalParticipatingShares = participatingRounds.reduce((sum, round) => sum + (round.shares_issued || 0), 0)

      const totalShares = this.getTotalShares(equityGrants)
      const participationRatio = totalParticipatingShares / totalShares
      const participatingProceeds = remainingProceeds * participationRatio

      totalPreferredProceeds += participatingProceeds
      remainingProceeds -= participatingProceeds
    }

    return {
      preferredProceeds: totalPreferredProceeds,
      commonProceeds: Math.max(0, remainingProceeds),
      waterfallSteps,
    }
  }

  private calculateSAFEConversion(
    safeAmount: number,
    valuationCap: number,
    discountRate: number,
    nextRoundValuation: number,
    nextRoundPrice: number,
  ): { conversionPrice: number; sharesIssued: number; conversionMethod: string } {
    // Calculate conversion price using valuation cap
    const capPrice = valuationCap ? valuationCap / 1000000 : Number.POSITIVE_INFINITY // Assuming 1M shares outstanding

    // Calculate conversion price using discount
    const discountPrice = nextRoundPrice * (1 - discountRate)

    // Use the lower of cap price or discount price (more favorable to investor)
    const conversionPrice = Math.min(capPrice, discountPrice, nextRoundPrice)
    const conversionMethod =
      conversionPrice === capPrice ? "valuation_cap" : conversionPrice === discountPrice ? "discount" : "no_conversion"

    const sharesIssued = safeAmount / conversionPrice

    return {
      conversionPrice,
      sharesIssued,
      conversionMethod,
    }
  }

  private calculateAntiDilution(
    originalPrice: number,
    newPrice: number,
    antiDilutionType: "weighted_average" | "full_ratchet" | "none",
    originalShares: number,
    newShares: number,
  ): { adjustedShares: number; adjustmentRatio: number } {
    if (antiDilutionType === "none" || newPrice >= originalPrice) {
      return { adjustedShares: originalShares, adjustmentRatio: 1.0 }
    }

    let adjustmentRatio = 1.0

    if (antiDilutionType === "full_ratchet") {
      adjustmentRatio = originalPrice / newPrice
    } else if (antiDilutionType === "weighted_average") {
      // Weighted average anti-dilution formula
      const totalShares = originalShares + newShares
      const weightedPrice = (originalShares * originalPrice + newShares * newPrice) / totalShares
      adjustmentRatio = originalPrice / weightedPrice
    }

    return {
      adjustedShares: originalShares * adjustmentRatio,
      adjustmentRatio,
    }
  }

  public calculateScenarioOutcomes(scenario: any, shareholders: any[], equityGrants: any[], fundingRounds: any[]): any {
    const startTime = performance.now()

    try {
      const totalShares = this.getTotalShares(equityGrants)
      const shareholderMaps = this.getShareholderMaps(shareholders, equityGrants)

      const shareholderOutcomes = shareholders.map((shareholder) => {
        const shareholderGrants = shareholderMaps.get(shareholder.id) || []
        const shareholderShares = shareholderGrants.reduce((sum, grant) => sum + (grant.shares_granted || 0), 0)

        const currentOwnership = totalShares > 0 ? (shareholderShares / totalShares) * 100 : 0

        let payout = 0
        const newOwnership = currentOwnership
        let returnMultiple = 0

        if (scenario.scenario_type === "exit") {
          const waterfall = this.calculateLiquidationWaterfall(scenario.exit_valuation, fundingRounds, equityGrants)

          // Calculate shareholder-specific payout
          payout = this.calculateShareholderExitPayout(
            shareholderGrants,
            shareholderShares,
            totalShares,
            scenario.exit_valuation,
            waterfall,
          )

          // Calculate return multiple based on actual investment
          const totalInvestment = shareholderGrants.reduce(
            (sum, grant) => sum + grant.shares_granted * (grant.strike_price || 0),
            0,
          )
          returnMultiple = totalInvestment > 0 ? payout / totalInvestment : 0
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

      const result = {
        totalProceeds: scenario.exit_valuation || 0,
        commonProceeds: 0,
        preferredProceeds: 0,
        dilutionPercentage: 0,
        shareholderOutcomes: shareholderOutcomes.sort((a, b) => b.payout - a.payout),
        performanceMetrics: {
          ...this.performanceMetrics,
          calculationTime: performance.now() - startTime,
        },
      }

      return result
    } finally {
      this.performanceMetrics.calculationTime = performance.now() - startTime
    }
  }

  private calculateShareholderExitPayout(
    shareholderGrants: any[],
    shareholderShares: number,
    totalShares: number,
    exitValuation: number,
    waterfall: any,
  ): number {
    const ownershipPercentage = totalShares > 0 ? shareholderShares / totalShares : 0

    // Check for preferred shares with liquidation preferences
    const preferredGrants = shareholderGrants.filter((grant) => grant.grant_type.includes("preferred"))

    if (preferredGrants.length > 0) {
      // Calculate preferred liquidation preference payout
      let preferredPayout = 0

      preferredGrants.forEach((grant) => {
        const liquidationPref = grant.liquidation_preference || 1.0
        const investmentAmount = grant.shares_granted * (grant.strike_price || 1.0)
        preferredPayout += Math.min(investmentAmount * liquidationPref, exitValuation * ownershipPercentage)
      })

      // Add participating preferred pro-rata share if applicable
      const participatingGrants = preferredGrants.filter((grant) => grant.is_participating)
      if (participatingGrants.length > 0) {
        const remainingAfterPreferred = Math.max(0, exitValuation - waterfall.preferredProceeds)
        const participatingPayout = ownershipPercentage * remainingAfterPreferred
        return preferredPayout + participatingPayout
      }

      return preferredPayout
    } else {
      // Common stock gets pro-rata share of remaining proceeds
      return ownershipPercentage * waterfall.commonProceeds
    }
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  public clearCache(): void {
    this.invalidateCache()
  }

  public getCacheStats(): { isValid: boolean; age: number } {
    return {
      isValid: this.isCacheValid(),
      age: this.cache.lastUpdated ? Date.now() - this.cache.lastUpdated : 0,
    }
  }
}

export const capTableCalculator = new OptimizedCapTableCalculator()

export function calculateScenarioOutcomes(
  scenario: any,
  shareholders: any[],
  equityGrants: any[],
  fundingRounds: any[],
): any {
  return capTableCalculator.calculateScenarioOutcomes(scenario, shareholders, equityGrants, fundingRounds)
}
